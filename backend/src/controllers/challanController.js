const { z } = require('zod');
const prisma = require('../config/db');
const { generateChallanPDF } = require('../utils/pdfGenerator');

const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().positive().optional(),
});

const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer is required'),
    items: z.array(challanItemSchema).min(1, 'At least one product item is required'),
    status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
    notes: z.string().optional().or(z.literal('')),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
  }),
});

// Helper to generate a sequential/unique Challan Number: CH-YYYYMMDD-XXXX
const generateChallanNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CH-${dateStr}-`;

  const latestChallan = await prisma.salesChallan.findFirst({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let nextSequence = 1;
  if (latestChallan && latestChallan.challanNumber) {
    const parts = latestChallan.challanNumber.split('-');
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, '0')}`;
};

const getChallans = async (req, res, next) => {
  try {
    const { search, status, customerId, page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          items: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        challans,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getChallanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, role: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, currentStock: true, location: true },
            },
          },
        },
      },
    });

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales Challan not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { challan },
    });
  } catch (error) {
    next(error);
  }
};

const createChallan = async (req, res, next) => {
  try {
    const { customerId, items, status = 'DRAFT', notes } = req.body;

    // 1. Fetch customer and prepare snapshot
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Selected customer was not found.',
      });
    }

    const customerSnapshot = {
      id: customer.id,
      name: customer.name,
      businessName: customer.businessName,
      mobile: customer.mobile,
      email: customer.email,
      gstNumber: customer.gstNumber,
      type: customer.type,
      address: customer.address,
    };

    // 2. Fetch products to get current prices and stock
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected products were not found.',
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3. Prepare items with snapshot data & calculate totals
    let totalQuantity = 0;
    let totalAmount = 0;

    const preparedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : Number(product.unitPrice);
      const subtotal = unitPrice * item.quantity;

      totalQuantity += item.quantity;
      totalAmount += subtotal;

      return {
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });

    const challanNumber = await generateChallanNumber();

    // 4. If status is CONFIRMED, check stock availability
    if (status === 'CONFIRMED') {
      for (const item of preparedItems) {
        const product = productMap.get(item.productId);
        if (product.currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Requested: ${item.quantity}. Stock cannot go negative.`,
          });
        }
      }
    }

    // 5. Execute creation within database transaction
    const newChallan = await prisma.$transaction(async (tx) => {
      const createdChallan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          customerSnapshot,
          status,
          totalQuantity,
          totalAmount,
          notes: notes || null,
          createdById: req.user.id,
          items: {
            create: preparedItems.map((item) => ({
              productId: item.productId,
              sku: item.sku,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // If CONFIRMED, deduct stock and create stock movement logs
      if (status === 'CONFIRMED') {
        for (const item of preparedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovementLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan #${challanNumber}`,
              createdById: req.user.id,
            },
          });
        }
      }

      return createdChallan;
    });

    return res.status(201).json({
      success: true,
      message: `Sales Challan created successfully (${status})`,
      data: { challan: newChallan },
    });
  } catch (error) {
    next(error);
  }
};

const updateChallanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales Challan not found',
      });
    }

    const currentStatus = challan.status;

    if (currentStatus === newStatus) {
      return res.status(400).json({
        success: false,
        message: `Challan is already in status '${newStatus}'.`,
      });
    }

    if (currentStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled challans cannot be updated.',
      });
    }

    // Transaction logic based on status transition
    const updatedChallan = await prisma.$transaction(async (tx) => {
      // Transition DRAFT -> CONFIRMED
      if (currentStatus === 'DRAFT' && newStatus === 'CONFIRMED') {
        // Validate stock for all items
        for (const item of challan.items) {
          const freshProduct = await tx.product.findUnique({ where: { id: item.productId } });
          if (!freshProduct || freshProduct.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for '${item.productName}' (SKU: ${item.sku}). Available: ${freshProduct ? freshProduct.currentStock : 0}, Required: ${item.quantity}.`
            );
          }
        }

        // Deduct stock and log
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovementLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan #${challan.challanNumber}`,
              createdById: req.user.id,
            },
          });
        }
      }

      // Transition CONFIRMED -> CANCELLED (Restore stock)
      if (currentStatus === 'CONFIRMED' && newStatus === 'CANCELLED') {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovementLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'IN',
              reason: `Cancelled Sales Challan #${challan.challanNumber}`,
              createdById: req.user.id,
            },
          });
        }
      }

      return await tx.salesChallan.update({
        where: { id },
        data: { status: newStatus },
        include: {
          customer: true,
          items: true,
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Sales Challan status updated to ${newStatus}`,
      data: { challan: updatedChallan },
    });
  } catch (error) {
    if (error.message.startsWith('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

const downloadPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales Challan not found',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Challan-${challan.challanNumber}.pdf`
    );

    generateChallanPDF(challan, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChallanSchema,
  updateStatusSchema,
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  downloadPDF,
};

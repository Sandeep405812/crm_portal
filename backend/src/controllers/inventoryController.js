const { z } = require('zod');
const prisma = require('../config/db');

const stockAdjustmentSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
    movementType: z.enum(['IN', 'OUT']),
    reason: z.string().min(2, 'Reason for stock adjustment is required'),
  }),
});

const adjustStock = async (req, res, next) => {
  try {
    const { productId, quantity, movementType, reason } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (movementType === 'OUT' && product.currentStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current available stock for '${product.name}' is ${product.currentStock}, cannot reduce by ${quantity}.`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newStock =
        movementType === 'IN'
          ? product.currentStock + quantity
          : product.currentStock - quantity;

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const log = await tx.stockMovementLog.create({
        data: {
          productId,
          quantity,
          movementType,
          reason,
          createdById: req.user.id,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      });

      return { product: updatedProduct, log };
    });

    return res.status(200).json({
      success: true,
      message: `Stock successfully adjusted (${movementType === 'IN' ? '+' : '-'}${quantity})`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getStockLogs = async (req, res, next) => {
  try {
    const { productId, movementType, search, page = 1, limit = 15 } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};

    if (productId) {
      where.productId = productId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.stockMovementLog.count({ where }),
      prisma.stockMovementLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, unitPrice: true, location: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
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

module.exports = {
  stockAdjustmentSchema,
  adjustStock,
  getStockLogs,
};

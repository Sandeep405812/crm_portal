const { z } = require('zod');
const prisma = require('../config/db');

const productSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    sku: z.string().min(2, 'SKU / Product code is required'),
    category: z.string().min(2, 'Category is required'),
    unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
    currentStock: z.coerce.number().int().min(0, 'Current stock cannot be negative').default(0),
    minStockAlert: z.coerce.number().int().min(0, 'Minimum stock alert cannot be negative').default(5),
    location: z.string().optional().or(z.literal('')),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    sku: z.string().min(2, 'SKU is required'),
    category: z.string().min(2, 'Category is required'),
    unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
    minStockAlert: z.coerce.number().int().min(0).default(5),
    location: z.string().optional().or(z.literal('')),
  }),
});

const getProducts = async (req, res, next) => {
  try {
    const { search, category, lowStock, page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
        { location: { contains: search } },
      ];
    }

    // Low stock filter (currentStock <= minStockAlert)
    // In Prisma MySQL, we can do raw query or filter in JS if small or where clause
    let products;
    let total;

    if (lowStock === 'true' || lowStock === true) {
      const allProducts = await prisma.product.findMany({
        where,
        orderBy: { currentStock: 'asc' },
      });
      const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);
      total = lowStockProducts.length;
      products = lowStockProducts.slice(skip, skip + pageSize);
    } else {
      [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { stockLogs: true },
            },
          },
        }),
      ]);
    }

    // Categories list for filters
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return res.status(200).json({
      success: true,
      data: {
        products,
        categories: categories.map((c) => c.category),
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

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

    const existingSku = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase().trim() },
    });

    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU '${sku}' already exists.`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          sku: sku.toUpperCase().trim(),
          category,
          unitPrice,
          currentStock: currentStock || 0,
          minStockAlert: minStockAlert !== undefined ? minStockAlert : 5,
          location: location || null,
        },
      });

      // If initial stock is greater than 0, create stock movement log
      if (currentStock && currentStock > 0) {
        await tx.stockMovementLog.create({
          data: {
            productId: product.id,
            quantity: currentStock,
            movementType: 'IN',
            reason: 'Initial Stock Creation',
            createdById: req.user.id,
          },
        });
      }

      return product;
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: result },
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sku, category, unitPrice, minStockAlert, location } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check SKU conflict
    if (sku && sku.toUpperCase().trim() !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku: sku.toUpperCase().trim() },
      });
      if (duplicateSku) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU '${sku}' already exists.`,
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku: sku ? sku.toUpperCase().trim() : undefined,
        category,
        unitPrice,
        minStockAlert,
        location: location || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updated },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  productSchema,
  updateProductSchema,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
};

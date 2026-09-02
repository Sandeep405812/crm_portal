const prisma = require('../config/db');

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      leadCustomers,
      activeCustomers,
      totalProducts,
      allProducts,
      totalChallans,
      confirmedChallans,
      draftChallans,
      recentChallans,
      recentStockLogs,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count(),
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true, unitPrice: true },
      }),
      prisma.salesChallan.count(),
      prisma.salesChallan.count({ where: { status: 'CONFIRMED' } }),
      prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.stockMovementLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    // Calculate low stock products and total inventory valuation
    let lowStockCount = 0;
    let totalInventoryValue = 0;
    const lowStockItems = [];

    allProducts.forEach((p) => {
      totalInventoryValue += Number(p.unitPrice) * p.currentStock;
      if (p.currentStock <= p.minStockAlert) {
        lowStockCount++;
        lowStockItems.push(p);
      }
    });

    // Calculate total revenue from confirmed challans
    const confirmedChallanSums = await prisma.salesChallan.aggregate({
      _sum: {
        totalAmount: true,
        totalQuantity: true,
      },
      where: { status: 'CONFIRMED' },
    });

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          customers: {
            total: totalCustomers,
            leads: leadCustomers,
            active: activeCustomers,
          },
          inventory: {
            totalProducts,
            lowStockCount,
            totalValuation: totalInventoryValue,
            lowStockItems: lowStockItems.slice(0, 5),
          },
          sales: {
            totalChallans,
            confirmed: confirmedChallans,
            draft: draftChallans,
            totalRevenue: confirmedChallanSums._sum.totalAmount || 0,
            totalUnitsSold: confirmedChallanSums._sum.totalQuantity || 0,
          },
        },
        recentChallans,
        recentStockLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};

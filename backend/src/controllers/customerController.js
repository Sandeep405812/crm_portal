const { z } = require('zod');
const prisma = require('../config/db');

const customerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required (at least 2 characters)'),
    mobile: z.string().min(8, 'Mobile number is required (at least 8 digits)'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    businessName: z.string().min(2, 'Business name is required'),
    gstNumber: z.string().optional().or(z.literal('')),
    type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('RETAIL'),
    address: z.string().optional().or(z.literal('')),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
    followUpDate: z.string().optional().nullable(),
    notes: z.string().optional().or(z.literal('')),
  }),
});

const followUpSchema = z.object({
  body: z.object({
    note: z.string().min(2, 'Note content is required'),
    followUpDate: z.string().optional().nullable(),
  }),
});

const getCustomers = async (req, res, next) => {
  try {
    const { search, status, type, page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
        { gstNumber: { contains: search } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          _count: {
            select: { followUps: true, challans: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        customers,
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

const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true },
            },
          },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true },
            },
            items: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      type,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email: email || null,
        businessName,
        gstNumber: gstNumber || null,
        type: type || 'RETAIL',
        address: address || null,
        status: status || 'LEAD',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // If initial notes provided, create initial followUp entry
    if (notes && notes.trim()) {
      await prisma.customerFollowUp.create({
        data: {
          customerId: customer.id,
          note: `Initial Note: ${notes}`,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          createdById: req.user.id,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      type,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name,
        mobile,
        email: email || null,
        businessName,
        gstNumber: gstNumber || null,
        type,
        address: address || null,
        status,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer: updated },
    });
  } catch (error) {
    next(error);
  }
};

const addFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, followUpDate } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: id,
        note,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Optionally update customer followUpDate
    if (followUpDate) {
      await prisma.customer.update({
        where: { id },
        data: { followUpDate: new Date(followUpDate) },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Follow-up note added successfully',
      data: { followUp },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  customerSchema,
  followUpSchema,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUp,
};

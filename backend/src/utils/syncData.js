const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

async function syncDefaultData() {
  try {
    console.log('🔄 Syncing default system users and sample data...');

    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const salesPasswordHash = await bcrypt.hash('Sales@123', 10);
    const warehousePasswordHash = await bcrypt.hash('Warehouse@123', 10);
    const accountsPasswordHash = await bcrypt.hash('Accounts@123', 10);

    const usersData = [
      {
        name: 'Krishna Sharma (Admin)',
        email: 'admin@erp.com',
        password: adminPasswordHash,
        role: 'ADMIN',
      },
      {
        name: 'Rajan Verma (Sales Exec)',
        email: 'sales@erp.com',
        password: salesPasswordHash,
        role: 'SALES',
      },
      {
        name: 'Gulshan Singh (Warehouse Head)',
        email: 'warehouse@erp.com',
        password: warehousePasswordHash,
        role: 'WAREHOUSE',
      },
      {
        name: 'Utkarsh Gupta (Accounts Manager)',
        email: 'accounts@erp.com',
        password: accountsPasswordHash,
        role: 'ACCOUNTS',
      },
    ];

    const createdUsers = {};
    for (const u of usersData) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { password: u.password, name: u.name, role: u.role },
        create: u,
      });
      createdUsers[u.role] = user;
    }

    const customersData = [
      {
        name: 'Ashu Sharma',
        mobile: '+91 98112 34567',
        email: 'ashu@apexindustrial.in',
        businessName: 'Apex Industrial Solutions Pvt Ltd',
        gstNumber: '07AAACA1234F1Z5',
        type: 'DISTRIBUTOR',
        address: 'Plot 45, Okhla Phase III, New Delhi - 110020',
        status: 'ACTIVE',
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        notes: 'Key distributor for North India region. Credit period 30 days.',
      },
      {
        name: 'Gulshan Mehta',
        mobile: '+91 99201 88442',
        email: 'gulshan@mehtatraders.com',
        businessName: 'Mehta Hardware & Electricals',
        gstNumber: '27AABCM9876C1Z2',
        type: 'WHOLESALE',
        address: 'Shop 12, Lohar Chawl, Kalbadevi, Mumbai - 400002',
        status: 'ACTIVE',
        followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: 'Interested in bulk orders of industrial relays and fasteners.',
      },
      {
        name: 'Utkarsh Patel',
        mobile: '+91 97234 11223',
        email: 'utkarsh.patel@novatech.co',
        businessName: 'NovaTech Automation Labs',
        gstNumber: '24AAACN4321D1Z8',
        type: 'RETAIL',
        address: 'GIDC Electronics Estate, Sector 25, Gandhinagar - 382024',
        status: 'LEAD',
        followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        notes: 'Inquired about digital multimeters and testing equipment for lab setup.',
      },
    ];

    for (const c of customersData) {
      const existing = await prisma.customer.findFirst({
        where: { mobile: c.mobile },
      });
      if (!existing) {
        await prisma.customer.create({
          data: {
            ...c,
            createdById: createdUsers.SALES ? createdUsers.SALES.id : undefined,
          },
        });
      } else {
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: c.name,
            email: c.email,
            businessName: c.businessName,
            gstNumber: c.gstNumber,
            type: c.type,
            address: c.address,
            status: c.status,
            notes: c.notes,
          },
        });
      }
    }

    console.log('✅ System default users & sample customers synchronized successfully.');
    return { success: true, message: 'Sync complete' };
  } catch (error) {
    console.error('⚠️ Sync default data error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = syncDefaultData;

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Users for all 4 Roles
  const passwordHash = await bcrypt.hash('Password@123', 10);
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
    console.log(`👤 User ready: ${user.email} (${user.role})`);
  }

  // 2. Create Products
  const productsData = [
    {
      name: 'Industrial Heavy-Duty Relay 24V',
      sku: 'REL-24V-HD',
      category: 'Electrical Components',
      unitPrice: 450.00,
      currentStock: 120,
      minStockAlert: 20,
      location: 'Rack A-12, Warehouse 1',
    },
    {
      name: 'Copper Bushing Bearing 25mm',
      sku: 'BRG-COP-25',
      category: 'Mechanical Hardware',
      unitPrice: 280.00,
      currentStock: 35,
      minStockAlert: 15,
      location: 'Bin B-04, Warehouse 1',
    },
    {
      name: 'Digital Multimeter Pro X-100',
      sku: 'DMM-PRO-X100',
      category: 'Testing Equipment',
      unitPrice: 1850.00,
      currentStock: 14,
      minStockAlert: 15, // Low stock on purpose
      location: 'Cabinet C-01, Warehouse 2',
    },
    {
      name: 'High-Tensile Steel Bolts M10 (Pack of 50)',
      sku: 'BLT-M10-HT50',
      category: 'Fasteners',
      unitPrice: 620.00,
      currentStock: 50,
      minStockAlert: 10,
      location: 'Rack D-08, Warehouse 1',
    },
    {
      name: 'Corrugated Packaging Carton Box Large',
      sku: 'PKG-BOX-LRG',
      category: 'Packaging',
      unitPrice: 45.00,
      currentStock: 4, // Critical low stock on purpose
      minStockAlert: 50,
      location: 'Bay P-02, Warehouse 2',
    },
    {
      name: 'Thermal Transfer Barcode Ribbon 110mm',
      sku: 'RBN-110MM-TH',
      category: 'Consumables',
      unitPrice: 320.00,
      currentStock: 80,
      minStockAlert: 15,
      location: 'Shelf E-03, Warehouse 1',
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    let product;
    if (!existing) {
      product = await prisma.product.create({
        data: p,
      });

      // Add initial stock movement log
      await prisma.stockMovementLog.create({
        data: {
          productId: product.id,
          quantity: product.currentStock,
          movementType: 'IN',
          reason: 'Initial Opening Stock Setup',
          createdById: createdUsers.WAREHOUSE.id,
        },
      });
    } else {
      product = existing;
    }
    createdProducts.push(product);
  }
  console.log(`📦 Seeded ${createdProducts.length} products`);

  // 3. Create Sample Customers
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
      createdById: createdUsers.SALES.id,
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
      createdById: createdUsers.SALES.id,
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
      createdById: createdUsers.SALES.id,
    },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const existing = await prisma.customer.findFirst({
      where: { mobile: c.mobile },
    });
    let customer;
    if (!existing) {
      customer = await prisma.customer.create({
        data: c,
      });

      // Add follow up entry
      await prisma.customerFollowUp.create({
        data: {
          customerId: customer.id,
          note: `Initial follow-up scheduled. Notes: ${c.notes}`,
          followUpDate: c.followUpDate,
          createdById: createdUsers.SALES.id,
        },
      });
    } else {
      customer = await prisma.customer.update({
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
    createdCustomers.push(customer);
  }
  console.log(`🤝 Seeded ${createdCustomers.length} customers with CRM follow-ups`);

  // 4. Create a Sample Confirmed Sales Challan
  const sampleChallanNumber = 'CH-20260901-0001';
  const existingChallan = await prisma.salesChallan.findUnique({
    where: { challanNumber: sampleChallanNumber },
  });

  if (existingChallan && createdCustomers.length > 0) {
    const targetCustomer = createdCustomers[0];
    await prisma.salesChallan.update({
      where: { challanNumber: sampleChallanNumber },
      data: {
        customerSnapshot: {
          id: targetCustomer.id,
          name: targetCustomer.name,
          businessName: targetCustomer.businessName,
          mobile: targetCustomer.mobile,
          email: targetCustomer.email,
          gstNumber: targetCustomer.gstNumber,
          type: targetCustomer.type,
          address: targetCustomer.address,
        },
      },
    });
    console.log(`📄 Sample Challan '${sampleChallanNumber}' customer snapshot updated`);
  } else if (!existingChallan && createdCustomers.length > 0 && createdProducts.length >= 2) {
    const targetCustomer = createdCustomers[0];
    const item1 = createdProducts[0]; // Relay
    const item2 = createdProducts[1]; // Bushing

    const qty1 = 5;
    const qty2 = 4;
    const subtotal1 = Number(item1.unitPrice) * qty1;
    const subtotal2 = Number(item2.unitPrice) * qty2;

    await prisma.salesChallan.create({
      data: {
        challanNumber: sampleChallanNumber,
        customerId: targetCustomer.id,
        customerSnapshot: {
          id: targetCustomer.id,
          name: targetCustomer.name,
          businessName: targetCustomer.businessName,
          mobile: targetCustomer.mobile,
          email: targetCustomer.email,
          gstNumber: targetCustomer.gstNumber,
          type: targetCustomer.type,
          address: targetCustomer.address,
        },
        status: 'CONFIRMED',
        totalQuantity: qty1 + qty2,
        totalAmount: subtotal1 + subtotal2,
        notes: 'Priority dispatch for factory maintenance order.',
        createdById: createdUsers.SALES.id,
        items: {
          create: [
            {
              productId: item1.id,
              sku: item1.sku,
              productName: item1.name,
              unitPrice: item1.unitPrice,
              quantity: qty1,
              subtotal: subtotal1,
            },
            {
              productId: item2.id,
              sku: item2.sku,
              productName: item2.name,
              unitPrice: item2.unitPrice,
              quantity: qty2,
              subtotal: subtotal2,
            },
          ],
        },
      },
    });

    console.log(`📄 Sample Confirmed Challan '${sampleChallanNumber}' created`);
  }

  console.log('✅ Seeding completed successfully!');
  console.log('\n--- Test User Credentials ---');
  console.log('Admin:      admin@erp.com      / Admin@123');
  console.log('Sales:      sales@erp.com      / Sales@123');
  console.log('Warehouse:  warehouse@erp.com  / Warehouse@123');
  console.log('Accounts:   accounts@erp.com   / Accounts@123');
  console.log('-----------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

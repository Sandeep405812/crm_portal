const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to MySQL Database successfully via Prisma');

    app.listen(PORT, () => {
      console.log(`🚀 CRM Portal Backend running on http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

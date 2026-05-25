require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const ConnectDB = require("./db/mongo");
const userRoutes = require("./routes/user.routes");
const propertyRoutes = require("./routes/property.routes");
const investmentRoutes = require("./routes/investment.routes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Hive Construction API');
});

app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/investments', investmentRoutes);

const reportRoutes = require("./routes/report.routes");
const notificationRoutes = require("./routes/notification.routes");
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Start server
const startServer = async () => {
  try {
    await ConnectDB();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

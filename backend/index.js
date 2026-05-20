require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const ticketRoutes = require('./routes/ticket');
const notificationRoutes = require('./routes/notification');
const historyRoutes = require('./routes/history');
const teamRoutes = require('./routes/team');
const analyticsRoutes = require('./routes/analytics');
const projectRoutes = require('./routes/project');
const iaRoutes = require('./routes/IA');

const app = express();
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    setInterval(async () => {
      try {
        await mongoose.connection.db.admin().ping();
        console.log("MongoDB ping OK ✅");
      } catch (err) {
        console.log("MongoDB ping failed ❌", err);
      }
    }, 5 * 60 * 1000);
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tickets', historyRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', iaRoutes);

app.get("/", (req, res) => {
  res.send("Hello from TicketFlow API 🚀");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
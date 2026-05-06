require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const ticketRoutes = require('./routes/ticket');

const app = express();
const port = process.env.PORT || 3000;

// ── MongoDB Connection avec options optimisées ──
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,        // ✅ Pool de connexions
    minPoolSize: 2,         // ✅ Minimum de connexions actives
    maxIdleTimeMS: 30000,   // ✅ Temps max d'inactivité
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // ✅ Keep alive — ping toutes les 5 minutes
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

// ── Middlewares ──
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tickets', ticketRoutes);

app.get("/", (req, res) => {
  res.send("Hello from TicketFlow API 🚀");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
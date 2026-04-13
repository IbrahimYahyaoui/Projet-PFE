require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const userRoutes = require('./routes/user');

const profileRoutes = require('./routes/profile');

const app = express();
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ── Middlewares ──
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);

app.get("/", (req, res) => {
  res.send("Hello from Express 2026 by ibrahim!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

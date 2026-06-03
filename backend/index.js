require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes         = require("./routes/auth");
const userRoutes         = require('./routes/user');
const profileRoutes      = require('./routes/profile');
const ticketRoutes       = require('./routes/ticket');
const notificationRoutes = require('./routes/notification');
const historyRoutes      = require('./routes/history');
const teamRoutes         = require('./routes/team');
const analyticsRoutes    = require('./routes/analytics');
const projectRoutes      = require('./routes/project');
const iaRoutes           = require('./routes/IA');
const chatHistoryRoutes  = require('./routes/chatHistory');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');

const app  = express();
const port = process.env.PORT || 3000;

// ── MongoDB ──
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
    console.log("Connected to MongoDB ✅");
    // Keep-alive ping
    setInterval(async () => {
      try {
        await mongoose.connection.db.admin().ping();
      } catch (err) {
        console.error("MongoDB ping failed ❌", err.message);
      }
    }, 5 * 60 * 1000);

    // Start background escalation job after DB is ready
    startEscalationJob();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── Routes ──
app.use("/api/auth",           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/profile',        profileRoutes);
app.use('/api/tickets',        ticketRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/tickets',        historyRoutes);
app.use('/api/team',           teamRoutes);
app.use('/api/analytics',      analyticsRoutes);
app.use('/api/projects',       projectRoutes);
app.use('/api/ai',             iaRoutes);
app.use('/api/chat-history',   chatHistoryRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);

app.get("/", (_req, res) => res.send("TicketFlow API 🚀"));

// ── 404 catch-all ──
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

// ════════════════════════════════════════════════════════════
// Background escalation job (runs every 30 minutes)
// ════════════════════════════════════════════════════════════
function startEscalationJob() {
  const runJob = require('./jobs/escalationJob');
  runJob(); // run once at startup
  setInterval(runJob, 30 * 60 * 1000);
}

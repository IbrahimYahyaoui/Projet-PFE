require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ── Middlewares ──
app.use(cors());
app.use(express.json());

// ── Routes ──
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello from Express 2026!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
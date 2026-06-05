// backend/routes/profile.js
const express = require('express');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');

// FIX 4 — IDOR : vérifie que l'utilisateur accède uniquement à son propre profil
// Exception : admin peut accéder à n'importe quel profil
const verifySelfOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ message: "Accès refusé : vous ne pouvez accéder qu'à votre propre profil" });
  }
  next();
};

const router = express.Router();

router.get('/:id',          verifyToken, verifySelfOrAdmin, getProfile);
router.put('/:id',          verifyToken, verifySelfOrAdmin, updateProfile);
router.put('/:id/password', verifyToken, verifySelfOrAdmin, changePassword);

module.exports = router;

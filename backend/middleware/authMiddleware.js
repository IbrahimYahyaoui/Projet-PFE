const jwt = require("jsonwebtoken");

// ── Vérifier que l'utilisateur est connecté ──
const verifyToken = (req, res, next) => {
  // Récupérer le token depuis le header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Stocker les infos du user dans la requête
    next(); // Passer à la suite
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ── Vérifier que l'utilisateur est admin ──
const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
};
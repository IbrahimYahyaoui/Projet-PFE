const jwt  = require("jsonwebtoken");
const User = require("../schemas/user");

// ── Vérifier que l'utilisateur est connecté et actif ──
// CORRECTION 1 : après jwt.verify(), on vérifie que le compte existe et est actif.
// req.user conserve le payload JWT (id, name, role) — on ne surcharge pas avec le doc Mongo.
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que le compte existe toujours et qu'il est actif
    const dbUser = await User.findById(decoded.id).select("isActive").lean();
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ message: "Compte désactivé ou introuvable" });
    }

    req.user = decoded; // payload JWT : { id, name, role, iat, exp }
    next();
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

// ── Analytics: admin ou leader uniquement ──
const verifyAnalyticsAccess = (req, res, next) => {
  const role = req.user?.role;
  if (role !== "admin" && role !== "leader") {
    return res.status(403).json({ message: "Accès analytics refusé" });
  }
  next();
};

// ── Projects: admin ou leader (manager) ──
const verifyManagerOrAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role !== "admin" && role !== "leader") {
    return res.status(403).json({ message: "Admin ou Leader requis" });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyAnalyticsAccess,
  verifyManagerOrAdmin,
};
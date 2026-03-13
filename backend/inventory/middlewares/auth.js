const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not logged in",
    });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Authenticated user:", payload);
    req.user = payload;
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid/expired token",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    console.log("Required roles:", roles, "User role:", req.user?.role);

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        userRole: req.user?.role || null,
        requiredRoles: roles,
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
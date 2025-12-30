const jwt = require("jsonwebtoken");
const SECRET = "your_secret_key_here"; // TODO: move to env var

const auth =
  (roles = []) =>
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Missing token" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid token" });

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      req.user = decoded;
      next();
    });
  };

module.exports = auth;

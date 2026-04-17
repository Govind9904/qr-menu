const { randomBytes } = require("crypto");

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const sessions = new Map();

function createAdminSession() {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  sessions.set(token, { expiresAt });
  return { token, expiresAt };
}

function deleteAdminSession(token) {
  sessions.delete(token);
}

function getTokenFromHeader(header = "") {
  if (!header.startsWith("Bearer ")) {
    return "";
  }
  return header.slice(7).trim();
}

function validateAdminSession(token) {
  const session = sessions.get(token);
  if (!session) {
    return false;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }

  return true;
}

function requireAdminAuth(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!validateAdminSession(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.adminToken = token;
  return next();
}

module.exports = {
  TOKEN_TTL_MS,
  createAdminSession,
  deleteAdminSession,
  getTokenFromHeader,
  requireAdminAuth,
  validateAdminSession,
};

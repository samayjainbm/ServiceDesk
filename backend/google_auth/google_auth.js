// backend/google_auth/google_auth.js
const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const prisma = require("../config/db");

// ----------------------
// ENV checks (fail fast)
// ----------------------
const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

if (!GOOGLE_WEB_CLIENT_ID) {
  console.warn("⚠️ GOOGLE_WEB_CLIENT_ID missing in .env");
}
if (!JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET missing in .env");
}

const googleClient = new OAuth2Client(GOOGLE_WEB_CLIENT_ID);

// ----------------------
// Helpers
// ----------------------
function signAppJwt(payload, expiresIn = "30d") {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is missing");
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Verify Google ID token and return payload
async function verifyGoogleIdToken(idToken) {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error("GOOGLE_WEB_CLIENT_ID is missing");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_WEB_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("Unable to read Google token payload");

  const googleSub = payload.sub;
  const email = payload.email || null;

  if (!googleSub) throw new Error("Google token missing sub");

  return {
    googleSub,
    email,
    name: payload.name || "",
    picture: payload.picture || "",
    emailVerified: payload.email_verified === true,
    raw: payload,
  };
}

// Find existing user by google_sub OR email
async function findUserByGoogleIdentity({ googleSub, email }) {
  return prisma.user_info.findFirst({
    where: {
      OR: [
        { google_sub: googleSub },
        ...(email ? [{ email }] : []),
      ],
    },
    select: {
      user_id: true,
      user_name: true,
      email: true,
      google_sub: true,
      avatar: true,
    },
  });
}

// ONLY login existing user, do not create new one
async function loginExistingUserFromGoogle({ googleSub, email, name, picture }) {
  const existing = await findUserByGoogleIdentity({ googleSub, email });

  if (!existing) {
    throw new Error("You are not a registered user of this app.");
  }

  // optional: existing record me missing google/email/avatar fill kar do
  const updated = await prisma.user_info.update({
    where: { user_id: existing.user_id },
    data: {
      google_sub: existing.google_sub || googleSub,
      email: existing.email || email,
      user_name: existing.user_name || name,
      avatar: existing.avatar || picture,
    },
    select: {
      user_id: true,
      user_name: true,
      email: true,
      google_sub: true,
      avatar: true,
    },
  });

  return updated;
}

// ----------------------
// ROUTES
// ----------------------

/**
 * POST /api/auth/google-auth/user
 * Body: { idToken }
 */
router.post("/user", async (req, res) => {
  try {
    const { idToken } = req.body || {};

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken required",
      });
    }

    const { googleSub, email, name, picture } = await verifyGoogleIdToken(idToken);

    const user = await loginExistingUserFromGoogle({
      googleSub,
      email,
      name,
      picture,
    });

    const token = signAppJwt({
      userId: user.user_id,
      role: "user",
    });

    return res.json({
      success: true,
      message: "Google login success (user)",
      token,
      user,
    });
  } catch (err) {
    console.error("Google user login error:", err);

    const msg = err.message || "Google login failed";

    if (
      msg.includes("not a registered user") ||
      msg.includes("not registered")
    ) {
      return res.status(403).json({
        success: false,
        message: msg,
      });
    }

    return res.status(401).json({
      success: false,
      message: msg,
    });
  }
});

/**
 * POST /api/auth/google-auth/pa
 * Body: { idToken }
 */
router.post("/pa", async (req, res) => {
  try {
    const { idToken } = req.body || {};

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken required",
      });
    }

    const { googleSub, email, name, picture } = await verifyGoogleIdToken(idToken);

    const user = await loginExistingUserFromGoogle({
      googleSub,
      email,
      name,
      picture,
    });

    const token = signAppJwt({
      role: "pa",
      email: email || "",
      userId: user.user_id,
    });

    return res.json({
      success: true,
      message: "Google login success (pa)",
      token,
      user,
    });
  } catch (err) {
    console.error("Google PA login error:", err);

    const msg = err.message || "Google login failed";

    if (
      msg.includes("not a registered user") ||
      msg.includes("not registered")
    ) {
      return res.status(403).json({
        success: false,
        message: msg,
      });
    }

    return res.status(401).json({
      success: false,
      message: msg,
    });
  }
});

/**
 * GET /api/auth/google-auth/health
 */
router.get("/health", (req, res) => {
  return res.json({
    success: true,
    hasGoogleClientId: !!GOOGLE_WEB_CLIENT_ID,
    hasJwtSecret: !!JWT_SECRET,
  });
});

module.exports = router;
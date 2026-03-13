// // backend/google_auth/google_auth.js
// const express = require("express");
// const router = express.Router();

// const jwt = require("jsonwebtoken");
// const { OAuth2Client } = require("google-auth-library");

// const prisma = require("../config/db"); // ✅ adjust if your db file path differs

// // ----------------------
// // ENV checks (fail fast)
// // ----------------------
// const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
// const JWT_SECRET = process.env.JWT_SECRET;

// if (!GOOGLE_WEB_CLIENT_ID) {
//   console.warn("⚠️ GOOGLE_WEB_CLIENT_ID missing in .env");
// }
// if (!JWT_SECRET) {
//   console.warn("⚠️ JWT_SECRET missing in .env");
// }

// const googleClient = new OAuth2Client(GOOGLE_WEB_CLIENT_ID);

// // ----------------------
// // Helpers
// // ----------------------
// function signAppJwt(payload, expiresIn = "30d") {
//   if (!JWT_SECRET) throw new Error("JWT_SECRET is missing");
//   return jwt.sign(payload, JWT_SECRET, { expiresIn });
// }

// // Verify Google ID token and return payload (email, sub, name...)
// async function verifyGoogleIdToken(idToken) {
//   if (!GOOGLE_WEB_CLIENT_ID) throw new Error("GOOGLE_WEB_CLIENT_ID is missing");

//   const ticket = await googleClient.verifyIdToken({
//     idToken,
//     audience: GOOGLE_WEB_CLIENT_ID,
//   });

//   const payload = ticket.getPayload();
//   if (!payload) throw new Error("Unable to read Google token payload");

//   // google unique id (stable)
//   const googleSub = payload.sub;
//   const email = payload.email || null;

//   if (!googleSub) throw new Error("Google token missing sub");

//   return {
//     googleSub,
//     email,
//     name: payload.name || "",
//     picture: payload.picture || "",
//     emailVerified: payload.email_verified === true,
//     raw: payload,
//   };
// }

// // Find user by google_sub OR email (if present)
// async function findUserByGoogleIdentity({ googleSub, email }) {
//   return prisma.user_info.findFirst({
//     where: {
//       OR: [
//         { google_sub: googleSub },
//         ...(email ? [{ email }] : []),
//       ],
//     },
//   });
// }

// // Create or update user record
// async function upsertUserFromGoogle({ googleSub, email, name, picture }) {
//   const existing = await findUserByGoogleIdentity({ googleSub, email });

//   // If found, update missing fields (safe)
//   if (existing) {
//     const updated = await prisma.user_info.update({
//       where: { user_id: existing.user_id },
//       data: {
//         google_sub: existing.google_sub || googleSub,
//         email: existing.email || email,
//         user_name: existing.user_name || name,
//         avatar: existing.avatar || picture,
//       },
//       select: {
//         user_id: true,
//         user_name: true,
//         email: true,
//         google_sub: true,
//         avatar: true,
//       },
//     });
//     return updated;
//   }

//   // If not found, create new record
//   try {
//     const created = await prisma.user_info.create({
//       data: {
//         email,
//         google_sub: googleSub,
//         user_name: name,
//         avatar: picture,
//         // other required columns (address / phone / password) are intentionally
//         // left out here; the schema currently marks them as mandatory which means
//         // a bare Google signup will fail.  We catch and translate the error so the
//         // frontend can show a nicer message.
//       },
//       select: {
//         user_id: true,
//         user_name: true,
//         email: true,
//         google_sub: true,
//         avatar: true,
//       },
//     });

//     return created;
//   } catch (err) {
//     // Prisma throws a fairly low‑level error describing which argument was
//     // missing.  Convert it into something our client can display directly.
//     if (err.message && err.message.includes('Argument `user_address` is missing')) {
//       throw new Error(
//         'Google signup failed because your profile is incomplete. ' +
//           'Please provide an address (and any other required details) before ' +
//           'continuing.'
//       );
//     }
//     // You could add additional checks here for phone_number, password, etc.
//     throw err;
//   }
// }

// // ----------------------
// // ROUTES
// // ----------------------

// /**
//  * POST /api/google-auth/user
//  * Body: { idToken }
//  * Returns: { success, token, user }
//  *
//  * Use this for normal "user" role login via Google.
//  */
// router.post("/user", async (req, res) => {
//   try {
//     const { idToken } = req.body || {};
//     if (!idToken) return res.status(400).json({ success: false, message: "idToken required" });

//     const { googleSub, email, name, picture } = await verifyGoogleIdToken(idToken);

//     // create/find user_info
//     const user = await upsertUserFromGoogle({ googleSub, email, name, picture });

//     // issue YOUR app token (role=user)
//     const token = signAppJwt({ user_id: user.user_id, role: "user" });

//     return res.json({
//       success: true,
//       message: "Google login success (user)",
//       token,
//       user,
//     });
//   } catch (err) {
//     console.error("Google user login error:", err);
//     // map our custom message to a 400 so the client knows it's a bad request,
//     // not an authentication failure.
//     if (err.message && err.message.includes('profile is incomplete')) {
//       return res.status(400).json({ success: false, message: err.message });
//     }
//     return res.status(401).json({ success: false, message: err.message || "Google login failed" });
//   }
// });

// /**
//  * POST /api/google-auth/pa
//  * Body: { idToken }
//  * Returns: { success, token, user }
//  *
//  * Use this for PA role login via Google.
//  * IMPORTANT: In production, restrict allowed emails/domains.
//  */
// router.post("/pa", async (req, res) => {
//   try {
//     const { idToken } = req.body || {};
//     if (!idToken) return res.status(400).json({ success: false, message: "idToken required" });

//     const { googleSub, email, name, picture } = await verifyGoogleIdToken(idToken);

//     // ✅ OPTIONAL SECURITY (highly recommended)
//     // Example: allow only your college domain
//     // if (!email || !email.endsWith("@manit.ac.in")) {
//     //   return res.status(403).json({ success: false, message: "Not allowed for PA" });
//     // }

//     // If you want PA in same table, we still upsert to user_info
//     const user = await upsertUserFromGoogle({ googleSub, email, name, picture });

//     // issue YOUR app token (role=pa)
//     const token = signAppJwt({ role: "pa", email: email || "", user_id: user.user_id });

//     return res.json({
//       success: true,
//       message: "Google login success (pa)",
//       token,
//       user,
//     });
//   } catch (err) {
//     console.error("Google PA login error:", err);
//     if (err.message && err.message.includes('profile is incomplete')) {
//       return res.status(400).json({ success: false, message: err.message });
//     }
//     return res.status(401).json({ success: false, message: err.message || "Google login failed" });
//   }
// });

// /**
//  * GET /api/google-auth/health
//  * Quick check
//  */
// router.get("/health", (req, res) => {
//   return res.json({
//     success: true,
//     hasGoogleClientId: !!GOOGLE_WEB_CLIENT_ID,
//     hasJwtSecret: !!JWT_SECRET,
//   });
// });

// module.exports = router;


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

// Verify Google ID token and return payload (email, sub, name...)
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

// Find user by google_sub OR email (if present)
async function findUserByGoogleIdentity({ googleSub, email }) {
  return prisma.user_info.findFirst({
    where: {
      OR: [
        { google_sub: googleSub },
        ...(email ? [{ email }] : []),
      ],
    },
  });
}

// Create or update user record
async function upsertUserFromGoogle({ googleSub, email, name, picture }) {
  const existing = await findUserByGoogleIdentity({ googleSub, email });

  if (existing) {
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

  try {
    const created = await prisma.user_info.create({
      data: {
        email,
        google_sub: googleSub,
        user_name: name,
        avatar: picture,
      },
      select: {
        user_id: true,
        user_name: true,
        email: true,
        google_sub: true,
        avatar: true,
      },
    });

    return created;
  } catch (err) {
    const msg = String(err?.message || "");

    if (
      msg.includes('Argument `user_address` is missing') ||
      msg.includes('Argument `phone_number` is missing') ||
      msg.includes('Argument `password` is missing')
    ) {
      throw new Error(
        "Google signup failed because your profile is incomplete. Please complete the required profile details before continuing."
      );
    }

    throw err;
  }
}

// ----------------------
// ROUTES
// ----------------------

/**
 * POST /api/auth/google-auth/user
 * Body: { idToken }
 * Returns: { success, token, user }
 *
 * Use this for normal "user" role login via Google.
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

    const user = await upsertUserFromGoogle({
      googleSub,
      email,
      name,
      picture,
    });

    // ✅ important fix: use userId to match your auth middleware/routes
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

    if (err.message && err.message.includes("profile is incomplete")) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(401).json({
      success: false,
      message: err.message || "Google login failed",
    });
  }
});

/**
 * POST /api/auth/google-auth/pa
 * Body: { idToken }
 * Returns: { success, token, user }
 *
 * Use this for PA role login via Google.
 * IMPORTANT: In production, restrict allowed emails/domains.
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

    // Optional domain restriction example:
    // if (!email || !email.endsWith("@manit.ac.in")) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Not allowed for PA",
    //   });
    // }

    const user = await upsertUserFromGoogle({
      googleSub,
      email,
      name,
      picture,
    });

    // ✅ important fix: use userId to match your auth middleware/routes
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

    if (err.message && err.message.includes("profile is incomplete")) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(401).json({
      success: false,
      message: err.message || "Google login failed",
    });
  }
});

/**
 * GET /api/auth/google-auth/health
 * Quick check
 */
router.get("/health", (req, res) => {
  return res.json({
    success: true,
    hasGoogleClientId: !!GOOGLE_WEB_CLIENT_ID,
    hasJwtSecret: !!JWT_SECRET,
  });
});

module.exports = router;

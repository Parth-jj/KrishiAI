import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { db, hashPassword, verifyPassword, UserRecord } from "../db.js";

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "farmer_advisory_jwt_secret_key_2026";

function getFirebaseApiKey(): string | null {
  const envKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  const candidates = [
    path.join(process.cwd(), "firebase-applet-config.json"),
    path.resolve(process.cwd(), "firebase-applet-config.json"),
  ];
  if (typeof __dirname !== "undefined") {
    candidates.push(
      path.resolve(__dirname, "../firebase-applet-config.json"),
      path.resolve(__dirname, "../../firebase-applet-config.json")
    );
  }

  for (const configPath of candidates) {
    try {
      if (fs.existsSync(configPath)) {
        const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (raw?.apiKey) return String(raw.apiKey);
      }
    } catch {
      // Try next candidate path
    }
  }
  return null;
}

// Helper to generate JWT token
export function generateToken(user: UserRecord): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferredLanguage: user.preferredLanguage
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Authentication Middleware
export function authenticateUser(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Register
authRouter.post("/register", (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role = "farmer", preferredLanguage = "en", farm } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existing = db.getUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists. Please sign in instead." });
    }

    const newUser = db.createUser({
      name: trimmedName,
      email: normalizedEmail,
      phone: typeof phone === "string" ? phone.trim() : "",
      passwordHash: hashPassword(password),
      role: role === "admin" ? "admin" : "farmer",
      preferredLanguage
    });

    // If farm details were provided during registration
    let farmRecord = null;
    if (farm) {
      farmRecord = db.saveFarm({
        userId: newUser.id,
        state: farm.state || "Andhra Pradesh",
        district: farm.district || "Guntur",
        village: farm.village || "",
        farmSizeAcres: Number(farm.farmSizeAcres) || 2.0,
        crop: farm.crop || "Paddy",
        sowingDate: farm.sowingDate || "",
        soilType: farm.soilType || "Alluvial Soil",
        irrigationSource: farm.irrigationSource || "Canal / Borewell"
      });
    }

    const token = generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    return res.status(201).json({
      message: "Registration successful",
      user: safeUser,
      farm: farmRecord,
      token
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// Login
authRouter.post("/login", (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = db.getUserByEmail(normalizedEmail);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);
    const farm = db.getFarmByUserId(user.id);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      message: "Login successful",
      user: safeUser,
      farm,
      token
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Login failed" });
  }
});

// Demo Fast Login
authRouter.post("/demo-login", (req: Request, res: Response) => {
  try {
    const { role = "farmer" } = req.body;
    const targetEmail = role === "admin" ? "admin@agriadvisory.org" : "farmer@agriadvisory.org";
    const user = db.getUserByEmail(targetEmail);

    if (!user) {
      return res.status(404).json({ error: "Demo user not found" });
    }

    const token = generateToken(user);
    const farm = db.getFarmByUserId(user.id);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      message: "Demo login successful",
      user: safeUser,
      farm,
      token
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Demo login failed" });
  }
});

// Get Current User Profile
authRouter.get("/me", authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const farm = db.getFarmByUserId(user.id);
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser, farm });
});

// Update Profile
authRouter.put("/me", authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { name, phone, preferredLanguage } = req.body;

  const updated = db.updateUser(user.id, {
    ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
    ...(phone !== undefined && typeof phone === "string" ? { phone: phone.trim() } : {}),
    ...(typeof preferredLanguage === "string" && preferredLanguage.trim() ? { preferredLanguage: preferredLanguage.trim() } : {})
  });

  if (!updated) {
    return res.status(404).json({ error: "User not found" });
  }

  const { passwordHash: _, ...safeUser } = updated;
  return res.json({ message: "Profile updated successfully", user: safeUser });
});

// Exchange a verified Firebase ID Token for a backend API session JWT
authRouter.post("/firebase-session", async (req: Request, res: Response) => {
  try {
    const { idToken, phone } = req.body;
    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({ error: "Firebase idToken is required" });
    }

    const apiKey = getFirebaseApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "Firebase configuration missing on server" });
    }

    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!verifyRes.ok) {
      return res.status(401).json({ error: "Invalid Firebase session token" });
    }

    const verifyData = (await verifyRes.json()) as {
      users?: Array<{ localId: string; email?: string; displayName?: string; phoneNumber?: string }>;
    };
    const fbUser = verifyData.users?.[0];
    if (!fbUser || !fbUser.email) {
      return res.status(401).json({ error: "Firebase user not found" });
    }

    const resolvedPhone =
      typeof phone === "string" && phone.trim()
        ? phone.trim()
        : fbUser.phoneNumber || "";

    const normalizedEmail = fbUser.email.trim().toLowerCase();
    let user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      user = db.createUser({
        name: fbUser.displayName || normalizedEmail.split("@")[0] || "Farmer",
        email: normalizedEmail,
        phone: resolvedPhone,
        passwordHash: hashPassword(`fb_${fbUser.localId}_${Date.now()}`),
        role: "farmer",
        preferredLanguage: "en",
      });
    } else if (resolvedPhone && user.phone !== resolvedPhone) {
      user = db.updateUser(user.id, { phone: resolvedPhone }) || user;
    }

    const token = generateToken(user);
    const farm = db.getFarmByUserId(user.id);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      message: "Firebase session synced",
      user: safeUser,
      farm,
      token,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to sync Firebase session" });
  }
});

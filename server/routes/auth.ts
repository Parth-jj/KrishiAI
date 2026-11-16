import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db, hashPassword, verifyPassword, UserRecord } from "../db.js";

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "farmer_advisory_jwt_secret_key_2026";

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

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const newUser = db.createUser({
      name,
      email,
      phone: phone || "",
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
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = db.getUserByEmail(email);
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
    ...(name && { name }),
    ...(phone !== undefined && { phone }),
    ...(preferredLanguage && { preferredLanguage })
  });

  if (!updated) {
    return res.status(404).json({ error: "User not found" });
  }

  const { passwordHash: _, ...safeUser } = updated;
  return res.json({ message: "Profile updated successfully", user: safeUser });
});

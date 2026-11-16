import express, { Request, Response } from "express";
import { db, FarmRecord } from "../db.js";
import { authenticateUser } from "./auth.js";

export const farmsRouter = express.Router();

// Get farm for current user
farmsRouter.get("/", authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const farm = db.getFarmByUserId(user.id);
  return res.json({ farm });
});

// Create or update farm for current user
farmsRouter.post("/", authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { state, district, village, farmSizeAcres, crop, sowingDate, soilType, irrigationSource } = req.body;

    if (!state || !district || !crop) {
      return res.status(400).json({ error: "State, district, and crop are required" });
    }

    const existingFarm = db.getFarmByUserId(user.id);

    const farmData = {
      id: existingFarm ? existingFarm.id : undefined,
      userId: user.id,
      state,
      district,
      village: village || "",
      farmSizeAcres: Number(farmSizeAcres) || 1.0,
      crop,
      sowingDate: sowingDate || "",
      soilType: soilType || "Alluvial Soil",
      irrigationSource: irrigationSource || "Canal / Borewell"
    };

    const savedFarm = db.saveFarm(farmData);
    return res.status(200).json({ message: "Farm profile updated successfully", farm: savedFarm });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update farm profile" });
  }
});

// Update specific farm by ID
farmsRouter.put("/:id", authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const farmId = req.params.id;
    const { state, district, village, farmSizeAcres, crop, sowingDate, soilType, irrigationSource } = req.body;

    const farmData = {
      id: farmId,
      userId: user.id,
      state,
      district,
      village: village || "",
      farmSizeAcres: Number(farmSizeAcres) || 1.0,
      crop,
      sowingDate: sowingDate || "",
      soilType: soilType || "Alluvial Soil",
      irrigationSource: irrigationSource || "Canal / Borewell"
    };

    const savedFarm = db.saveFarm(farmData);
    return res.json({ message: "Farm updated successfully", farm: savedFarm });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update farm" });
  }
});

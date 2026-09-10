import type { Request, Response } from "express";
import {
  createEquipment,
  deleteEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  validateEquipmentStatus,
} from "../services/equipment.service.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isStringParam(value: string | string[] | undefined): value is string {
  return typeof value === "string";
}

function isValidUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export async function listEquipment(_req: Request, res: Response) {
  const equipment = await getAllEquipment();
  res.json(equipment);
}

export async function getEquipment(req: Request, res: Response) {
  const { id } = req.params;

  if (!isStringParam(id) || !isValidUuid(id)) {
    return res.status(400).json({ message: "Invalid equipment id" });
  }

  const equipment = await getEquipmentById(id);

  if (!equipment) {
    return res.status(404).json({ message: "Equipment not found" });
  }

  return res.json(equipment);
}

export async function createEquipmentHandler(req: Request, res: Response) {
  const { name, code, status } = req.body as {
    name?: unknown;
    code?: unknown;
    status?: unknown;
  };

  if (typeof name !== "string" || typeof code !== "string") {
    return res.status(400).json({ message: "name and code are required" });
  }

  let parsedStatus;
  try {
    parsedStatus = validateEquipmentStatus(status);
  } catch {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const equipment = await createEquipment({
      name,
      code,
      status: parsedStatus,
    });

    return res.status(201).json(equipment);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({ message: "Equipment code already exists" });
    }

    console.error("Create equipment failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateEquipmentHandler(req: Request, res: Response) {
  const { id } = req.params;

  if (!isStringParam(id) || !isValidUuid(id)) {
    return res.status(400).json({ message: "Invalid equipment id" });
  }

  const { name, code, status } = req.body as {
    name?: unknown;
    code?: unknown;
    status?: unknown;
  };

  const payload: {
    name?: string;
    code?: string;
    status?: "ACTIVE" | "RETIRED";
  } = {};

  if (name !== undefined) {
    if (typeof name !== "string") {
      return res.status(400).json({ message: "name must be a string" });
    }
    payload.name = name;
  }

  if (code !== undefined) {
    if (typeof code !== "string") {
      return res.status(400).json({ message: "code must be a string" });
    }
    payload.code = code;
  }

  if (status !== undefined) {
    try {
      payload.status = validateEquipmentStatus(status);
    } catch {
      return res.status(400).json({ message: "Invalid status" });
    }
  }

  try {
    const equipment = await updateEquipment(id, payload);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    return res.json(equipment);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({ message: "Equipment code already exists" });
    }

    console.error("Update equipment failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteEquipmentHandler(req: Request, res: Response) {
  const { id } = req.params;

  if (!isStringParam(id) || !isValidUuid(id)) {
    return res.status(400).json({ message: "Invalid equipment id" });
  }

  try {
    const deleted = await deleteEquipment(id);

    if (!deleted) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    return res.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    console.error("Delete equipment failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

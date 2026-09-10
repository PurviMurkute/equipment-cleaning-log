import type { Request, Response } from "express";
import { validate as uuidValidate } from "uuid";
import {
  createEquipment,
  deleteEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  validateEquipmentStatus,
} from "../services/equipment.service.js";
import type {
  CreateEquipmentRequestDto,
  UpdateEquipmentRequestDto,
} from "../dto/equipment.dto.js";
import type { EquipmentIdParamsDto } from "../dto/request.dto.js";

function hasValidUuid(id: string | undefined): id is string {
  return typeof id === "string" && uuidValidate(id);
}

export async function listEquipment(_req: Request, res: Response) {
  const equipment = await getAllEquipment();
  res.json(equipment);
}

export async function getEquipment(
  req: Request<EquipmentIdParamsDto>,
  res: Response,
) {
  const { id } = req.params;

  if (!hasValidUuid(id)) {
    return res.status(400).json({ message: "Invalid equipment id" });
  }

  const equipment = await getEquipmentById(id);

  if (!equipment) {
    return res.status(404).json({ message: "Equipment not found" });
  }

  return res.json(equipment);
}

export async function createEquipmentHandler(
  req: Request<unknown, unknown, CreateEquipmentRequestDto>,
  res: Response,
) {
  const { name, code, status } = req.body;

  if (typeof name !== "string" || typeof code !== "string") {
    return res.status(400).json({ message: "name and code are required" });
  }

  let parsedStatus: ReturnType<typeof validateEquipmentStatus>;
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

export async function updateEquipmentHandler(
  req: Request<EquipmentIdParamsDto, unknown, UpdateEquipmentRequestDto>,
  res: Response,
) {
  const { id } = req.params;

  if (!hasValidUuid(id)) {
    return res.status(400).json({ message: "Invalid equipment id" });
  }

  const { name, code, status } = req.body;
  const payload: UpdateEquipmentRequestDto = {};

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

export async function deleteEquipmentHandler(
  req: Request<EquipmentIdParamsDto>,
  res: Response,
) {
  const { id } = req.params;

  if (!hasValidUuid(id)) {
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

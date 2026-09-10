import type { Request, Response } from "express";
import { validate as uuidValidate } from "uuid";
import {
  createCleaningRecord,
  equipmentExists,
  getCleaningRecordAuditHistory,
  getCleaningRecordById,
  getCleaningRecordsByEquipment,
  updateCleaningRecord,
  validateCleaningRecordStatus,
} from "../services/cleaning-record.service.js";
import type {
  CreateCleaningRecordRequestDto,
  UpdateCleaningRecordRequestDto,
} from "../dto/cleaning-record.dto.js";
import type { CleaningRecordAuditHistoryResponseDto } from "../dto/audit.dto.js";
import type { CleaningRecordStatus } from "../dto/common.dto.js";
import type {
  CleaningRecordIdParamsDto,
  CleaningRecordListQueryDto,
  EquipmentCleaningRecordsParamsDto,
} from "../dto/request.dto.js";

function parsePositiveInteger(value: unknown, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function hasValidUuid(id: string | undefined): id is string {
  return typeof id === "string" && uuidValidate(id);
}

export async function createCleaningRecordHandler(
  req: Request<
    EquipmentCleaningRecordsParamsDto,
    unknown,
    CreateCleaningRecordRequestDto
  >,
  res: Response,
) {
  const { equipmentId } = req.params;

  if (!hasValidUuid(equipmentId)) {
    return res.status(400).json({ message: "Invalid equipment id" });
  }

  const { cleanedBy, cleanedAt, method, notes, status } = req.body;

  if (typeof cleanedBy !== "string" || typeof cleanedAt !== "string" || typeof method !== "string") {
    return res.status(400).json({
      message: "cleanedBy, cleanedAt, and method are required",
    });
  }

  if (notes !== undefined && typeof notes !== "string") {
    return res.status(400).json({ message: "notes must be a string" });
  }

  if (req.body.changedBy !== undefined && typeof req.body.changedBy !== "string") {
    return res.status(400).json({ message: "changedBy must be a string" });
  }

  let parsedStatus: CleaningRecordStatus | undefined;
  try {
    parsedStatus = validateCleaningRecordStatus(status);
  } catch {
    return res.status(400).json({ message: "Invalid status" });
  }

  const exists = await equipmentExists(equipmentId);
  if (!exists) {
    return res.status(404).json({ message: "Equipment not found" });
  }

  try {
    const cleaningRecord = await createCleaningRecord(equipmentId, {
      cleanedBy,
      cleanedAt,
      method,
      notes,
      status: parsedStatus,
      changedBy: req.body.changedBy,
    });

    return res.status(201).json(cleaningRecord);
  } catch (error) {
    console.error("Create cleaning record failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listCleaningRecordsHandler(
  req: Request<
    EquipmentCleaningRecordsParamsDto,
    unknown,
    unknown,
    CleaningRecordListQueryDto
  >,
  res: Response,
) {
  const { equipmentId } = req.params;

  if (!hasValidUuid(equipmentId)) {
    return res.status(400).json({ message: "Invalid equipment id" });
  }

  const exists = await equipmentExists(equipmentId);
  if (!exists) {
    return res.status(404).json({ message: "Equipment not found" });
  }

  const page = parsePositiveInteger(req.query.page, 1);
  const limit = parsePositiveInteger(req.query.limit, 10);
  const statusQuery = req.query.status;

  let status: CleaningRecordStatus | undefined;
  if (statusQuery !== undefined) {
    try {
      status = validateCleaningRecordStatus(statusQuery);
    } catch {
      return res.status(400).json({ message: "Invalid status" });
    }
  }

  try {
    const { data, total } = await getCleaningRecordsByEquipment(
      equipmentId,
      page,
      limit,
      status,
    );

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List cleaning records failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCleaningRecordHandler(
  req: Request<CleaningRecordIdParamsDto, unknown, UpdateCleaningRecordRequestDto>,
  res: Response,
) {
  const { id } = req.params;

  if (!hasValidUuid(id)) {
    return res.status(400).json({ message: "Invalid cleaning record id" });
  }

  const { cleanedBy, cleanedAt, method, notes, status } = req.body;
  const payload: UpdateCleaningRecordRequestDto = {};

  if (cleanedBy !== undefined) {
    if (typeof cleanedBy !== "string") {
      return res.status(400).json({ message: "cleanedBy must be a string" });
    }
    payload.cleanedBy = cleanedBy;
  }

  if (cleanedAt !== undefined) {
    if (typeof cleanedAt !== "string") {
      return res.status(400).json({ message: "cleanedAt must be a string" });
    }
    payload.cleanedAt = cleanedAt;
  }

  if (method !== undefined) {
    if (typeof method !== "string") {
      return res.status(400).json({ message: "method must be a string" });
    }
    payload.method = method;
  }

  if (notes !== undefined) {
    if (notes !== null && typeof notes !== "string") {
      return res.status(400).json({ message: "notes must be a string or null" });
    }
    payload.notes = notes;
  }

  if (req.body.changedBy !== undefined) {
    if (typeof req.body.changedBy !== "string") {
      return res.status(400).json({ message: "changedBy must be a string" });
    }
    payload.changedBy = req.body.changedBy;
  }

  if (status !== undefined) {
    try {
      payload.status = validateCleaningRecordStatus(status);
    } catch {
      return res.status(400).json({ message: "Invalid status" });
    }
  }

  try {
    const cleaningRecord = await updateCleaningRecord(id, payload);

    if (!cleaningRecord) {
      return res.status(404).json({ message: "Cleaning record not found" });
    }

    return res.json(cleaningRecord);
  } catch (error) {
    console.error("Update cleaning record failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCleaningRecordAuditHistoryHandler(
  req: Request<CleaningRecordIdParamsDto>,
  res: Response,
) {
  const { id } = req.params;

  if (!hasValidUuid(id)) {
    return res.status(400).json({ message: "Invalid cleaning record id" });
  }

  const record = await getCleaningRecordById(id);
  if (!record) {
    return res.status(404).json({ message: "Cleaning record not found" });
  }

  try {
    const data = await getCleaningRecordAuditHistory(id);
    const response: CleaningRecordAuditHistoryResponseDto = { data };
    return res.json(response);
  } catch (error) {
    console.error("Get cleaning record audit history failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

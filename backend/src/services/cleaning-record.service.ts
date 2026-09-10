import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import type { CleaningRecordStatus } from "../dto/common.dto.js";
import type {
  CleaningRecordDto,
  CreateCleaningRecordRequestDto,
  UpdateCleaningRecordRequestDto,
} from "../dto/cleaning-record.dto.js";

const validStatuses: CleaningRecordStatus[] = ["PENDING", "VERIFIED"];

function isValidStatus(value: unknown): value is CleaningRecordStatus {
  return typeof value === "string" && validStatuses.includes(value as CleaningRecordStatus);
}

export function validateCleaningRecordStatus(
  value: unknown,
): CleaningRecordStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isValidStatus(value)) {
    throw new Error("Invalid status");
  }

  return value;
}

export async function equipmentExists(equipmentId: string): Promise<boolean> {
  const result = await pool.query(
    `
      SELECT 1
      FROM "Equipment"
      WHERE "id" = $1;
    `,
    [equipmentId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function createCleaningRecord(
  equipmentId: string,
  input: CreateCleaningRecordRequestDto,
): Promise<CleaningRecordDto> {
  const result = await pool.query(
    `
      INSERT INTO "CleaningRecord" (
        "id",
        "equipmentId",
        "cleanedBy",
        "cleanedAt",
        "method",
        "notes",
        "status"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        "id",
        "equipmentId",
        "cleanedBy",
        "cleanedAt",
        "method",
        "notes",
        "status",
        "createdAt",
        "updatedAt";
    `,
    [
      uuidv4(),
      equipmentId,
      input.cleanedBy,
      input.cleanedAt,
      input.method,
      input.notes ?? null,
      input.status ?? "PENDING",
    ],
  );

  return result.rows[0];
}

export async function getCleaningRecordsByEquipment(
  equipmentId: string,
  page: number,
  limit: number,
  status?: CleaningRecordStatus,
): Promise<{ data: CleaningRecordDto[]; total: number }> {
  const values: unknown[] = [equipmentId];
  let whereClause = `"equipmentId" = $1`;

  if (status !== undefined) {
    values.push(status);
    whereClause += ` AND "status" = $${values.length}`;
  }

  const countResult = await pool.query(
    `
      SELECT COUNT(*)::int AS "total"
      FROM "CleaningRecord"
      WHERE ${whereClause};
    `,
    values,
  );

  values.push(limit, (page - 1) * limit);

  const dataResult = await pool.query(
    `
      SELECT
        "id",
        "equipmentId",
        "cleanedBy",
        "cleanedAt",
        "method",
        "notes",
        "status",
        "createdAt",
        "updatedAt"
      FROM "CleaningRecord"
      WHERE ${whereClause}
      ORDER BY "cleanedAt" DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length};
    `,
    values,
  );

  return {
    data: dataResult.rows,
    total: countResult.rows[0]?.total ?? 0,
  };
}

export async function getCleaningRecordById(
  id: string,
): Promise<CleaningRecordDto | null> {
  const result = await pool.query(
    `
      SELECT
        "id",
        "equipmentId",
        "cleanedBy",
        "cleanedAt",
        "method",
        "notes",
        "status",
        "createdAt",
        "updatedAt"
      FROM "CleaningRecord"
      WHERE "id" = $1;
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function updateCleaningRecord(
  id: string,
  input: UpdateCleaningRecordRequestDto,
): Promise<CleaningRecordDto | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.cleanedBy !== undefined) {
    values.push(input.cleanedBy);
    updates.push(`"cleanedBy" = $${values.length}`);
  }

  if (input.cleanedAt !== undefined) {
    values.push(input.cleanedAt);
    updates.push(`"cleanedAt" = $${values.length}`);
  }

  if (input.method !== undefined) {
    values.push(input.method);
    updates.push(`"method" = $${values.length}`);
  }

  if (input.notes !== undefined) {
    values.push(input.notes);
    updates.push(`"notes" = $${values.length}`);
  }

  if (input.status !== undefined) {
    values.push(input.status);
    updates.push(`"status" = $${values.length}`);
  }

  if (updates.length === 0) {
    return getCleaningRecordById(id);
  }

  values.push(id);

  const result = await pool.query(
    `
      UPDATE "CleaningRecord"
      SET ${updates.join(", ")}, "updatedAt" = NOW()
      WHERE "id" = $${values.length}
      RETURNING
        "id",
        "equipmentId",
        "cleanedBy",
        "cleanedAt",
        "method",
        "notes",
        "status",
        "createdAt",
        "updatedAt";
    `,
    values,
  );

  return result.rows[0] ?? null;
}

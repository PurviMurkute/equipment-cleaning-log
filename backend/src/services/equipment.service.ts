import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import type {
  CreateEquipmentRequestDto,
  EquipmentDto,
  UpdateEquipmentRequestDto,
} from "../dto/equipment.dto.js";
import type { EquipmentStatus } from "../dto/common.dto.js";

const validStatuses: EquipmentStatus[] = ["ACTIVE", "RETIRED"];

function isValidStatus(value: unknown): value is EquipmentStatus {
  return typeof value === "string" && validStatuses.includes(value as EquipmentStatus);
}

export function validateEquipmentStatus(value: unknown): EquipmentStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isValidStatus(value)) {
    throw new Error("Invalid status");
  }

  return value;
}

export async function getAllEquipment(): Promise<EquipmentDto[]> {
  const result = await pool.query(
    `
      SELECT
        "id",
        "name",
        "code",
        "status",
        "createdAt",
        "updatedAt"
      FROM "Equipment"
      ORDER BY "createdAt" DESC;
    `,
  );

  return result.rows;
}

export async function getEquipmentById(id: string): Promise<EquipmentDto | null> {
  const result = await pool.query(
    `
      SELECT
        "id",
        "name",
        "code",
        "status",
        "createdAt",
        "updatedAt"
      FROM "Equipment"
      WHERE "id" = $1;
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function createEquipment(
  input: CreateEquipmentRequestDto,
): Promise<EquipmentDto> {
  const result = await pool.query(
    `
      INSERT INTO "Equipment" ("id", "name", "code", "status")
      VALUES ($1, $2, $3, $4)
      RETURNING
        "id",
        "name",
        "code",
        "status",
        "createdAt",
        "updatedAt";
    `,
    [uuidv4(), input.name, input.code, input.status ?? "ACTIVE"],
  );

  return result.rows[0];
}

export async function updateEquipment(
  id: string,
  input: UpdateEquipmentRequestDto,
): Promise<EquipmentDto | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    values.push(input.name);
    updates.push(`"name" = $${values.length}`);
  }

  if (input.code !== undefined) {
    values.push(input.code);
    updates.push(`"code" = $${values.length}`);
  }

  if (input.status !== undefined) {
    values.push(input.status);
    updates.push(`"status" = $${values.length}`);
  }

  if (updates.length === 0) {
    return getEquipmentById(id);
  }

  values.push(id);

  const result = await pool.query(
    `
      UPDATE "Equipment"
      SET ${updates.join(", ")}, "updatedAt" = NOW()
      WHERE "id" = $${values.length}
      RETURNING
        "id",
        "name",
        "code",
        "status",
        "createdAt",
        "updatedAt";
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM "Equipment"
      WHERE "id" = $1;
    `,
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}

import type { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import type { CleaningRecordStatus } from "../dto/common.dto.js";
import type { AuditEntryDto } from "../dto/audit.dto.js";
import type {
  CleaningRecordDto,
  CreateCleaningRecordRequestDto,
  UpdateCleaningRecordRequestDto,
} from "../dto/cleaning-record.dto.js";

const validStatuses: CleaningRecordStatus[] = ["PENDING", "VERIFIED"];

type DbExecutor = Pick<PoolClient, "query">;

type AuditChange = {
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

function isValidStatus(value: unknown): value is CleaningRecordStatus {
  return typeof value === "string" && validStatuses.includes(value as CleaningRecordStatus);
}

function toIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toAuditValue(value: string | null | undefined): string | null {
  return value ?? null;
}

function isEmpty(value: string | null | undefined): boolean {
  return value === null || value === undefined || value === "";
}

function normalizeChangedBy(value: string | undefined): string {
  return isEmpty(value) ? "system" : (value as string);
}

async function runInTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertAuditEntries(
  client: DbExecutor,
  cleaningRecordId: string,
  changedBy: string,
  changedAt: string,
  changes: AuditChange[],
): Promise<void> {
  for (const change of changes) {
    await client.query(
      `
        INSERT INTO "AuditEntry" (
          "id",
          "cleaningRecordId",
          "changedBy",
          "changedAt",
          "field",
          "oldValue",
          "newValue"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `,
      [
        uuidv4(),
        cleaningRecordId,
        changedBy,
        changedAt,
        change.field,
        change.oldValue,
        change.newValue,
      ],
    );
  }
}

function buildCreateAuditChanges(
  input: CreateCleaningRecordRequestDto,
  createdStatus: CleaningRecordStatus,
): AuditChange[] {
  return [
    {
      field: "cleanedBy",
      oldValue: null,
      newValue: input.cleanedBy,
    },
    {
      field: "cleanedAt",
      oldValue: null,
      newValue: toIsoString(input.cleanedAt),
    },
    {
      field: "method",
      oldValue: null,
      newValue: input.method,
    },
    {
      field: "notes",
      oldValue: null,
      newValue: toAuditValue(input.notes),
    },
    {
      field: "status",
      oldValue: null,
      newValue: createdStatus,
    },
  ];
}

function buildUpdateAuditChanges(
  existing: CleaningRecordDto,
  input: UpdateCleaningRecordRequestDto,
): AuditChange[] {
  const changes: AuditChange[] = [];

  if (input.cleanedBy !== undefined && input.cleanedBy !== existing.cleanedBy) {
    changes.push({
      field: "cleanedBy",
      oldValue: existing.cleanedBy,
      newValue: input.cleanedBy,
    });
  }

  if (input.cleanedAt !== undefined) {
    const nextValue = toIsoString(input.cleanedAt);
    const currentValue = existing.cleanedAt.toISOString();

    if (nextValue !== currentValue) {
      changes.push({
        field: "cleanedAt",
        oldValue: currentValue,
        newValue: nextValue,
      });
    }
  }

  if (input.method !== undefined && input.method !== existing.method) {
    changes.push({
      field: "method",
      oldValue: existing.method,
      newValue: input.method,
    });
  }

  if (input.notes !== undefined) {
    const nextValue = toAuditValue(input.notes);
    const currentValue = toAuditValue(existing.notes);

    if (nextValue !== currentValue) {
      changes.push({
        field: "notes",
        oldValue: currentValue,
        newValue: nextValue,
      });
    }
  }

  if (input.status !== undefined && input.status !== existing.status) {
    changes.push({
      field: "status",
      oldValue: existing.status,
      newValue: input.status,
    });
  }

  return changes;
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
  return runInTransaction(async (client) => {
    const createdStatus = input.status ?? "PENDING";
    const changedBy = normalizeChangedBy(input.changedBy);
    const changedAt = new Date().toISOString();

    const result = await client.query(
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
        createdStatus,
      ],
    );

    const cleaningRecord = result.rows[0] as CleaningRecordDto;

    await insertAuditEntries(
      client,
      cleaningRecord.id,
      changedBy,
      changedAt,
      buildCreateAuditChanges(input, createdStatus),
    );

    return cleaningRecord;
  });
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
    data: dataResult.rows as CleaningRecordDto[],
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

  return (result.rows[0] as CleaningRecordDto | undefined) ?? null;
}

export async function updateCleaningRecord(
  id: string,
  input: UpdateCleaningRecordRequestDto,
): Promise<CleaningRecordDto | null> {
  return runInTransaction(async (client) => {
    const existingResult = await client.query(
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
        WHERE "id" = $1
        FOR UPDATE;
      `,
      [id],
    );

    const existing = (existingResult.rows[0] as CleaningRecordDto | undefined) ?? null;
    if (!existing) {
      return null;
    }

    const changedBy = normalizeChangedBy(input.changedBy);
    const changedAt = new Date().toISOString();
    const changes = buildUpdateAuditChanges(existing, input);

    if (changes.length === 0) {
      return existing;
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.cleanedBy !== undefined && input.cleanedBy !== existing.cleanedBy) {
      values.push(input.cleanedBy);
      updates.push(`"cleanedBy" = $${values.length}`);
    }

    if (input.cleanedAt !== undefined) {
      const nextValue = toIsoString(input.cleanedAt);
      if (nextValue !== existing.cleanedAt.toISOString()) {
        values.push(input.cleanedAt);
        updates.push(`"cleanedAt" = $${values.length}`);
      }
    }

    if (input.method !== undefined && input.method !== existing.method) {
      values.push(input.method);
      updates.push(`"method" = $${values.length}`);
    }

    if (input.notes !== undefined) {
      const nextValue = toAuditValue(input.notes);
      if (nextValue !== toAuditValue(existing.notes)) {
        values.push(input.notes);
        updates.push(`"notes" = $${values.length}`);
      }
    }

    if (input.status !== undefined && input.status !== existing.status) {
      values.push(input.status);
      updates.push(`"status" = $${values.length}`);
    }

    values.push(id);

    const updatedResult = await client.query(
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

    const updatedRecord = updatedResult.rows[0] as CleaningRecordDto;

    await insertAuditEntries(client, id, changedBy, changedAt, changes);

    return updatedRecord;
  });
}

export async function getCleaningRecordAuditHistory(
  cleaningRecordId: string,
): Promise<AuditEntryDto[]> {
  const result = await pool.query(
    `
      SELECT
        "id",
        "cleaningRecordId",
        "changedBy",
        "changedAt",
        "field",
        "oldValue",
        "newValue"
      FROM "AuditEntry"
      WHERE "cleaningRecordId" = $1
      ORDER BY "changedAt" ASC, "id" ASC;
    `,
    [cleaningRecordId],
  );

  return result.rows as AuditEntryDto[];
}

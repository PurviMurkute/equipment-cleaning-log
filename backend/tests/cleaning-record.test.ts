import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { createServer } from "node:http";
import { v4 as uuidv4 } from "uuid";
import app from "../src/app.js";
import pool from "../src/config/db.js";

type JsonResponse<T> = {
  status: number;
  body: T;
};

type CleaningRecordResponse = {
  id: string;
  equipmentId: string;
  cleanedBy: string;
  cleanedAt: string;
  method: string;
  notes: string | null;
  status: "PENDING" | "VERIFIED";
  createdAt: string;
  updatedAt: string;
};

type AuditEntryResponse = {
  id: string;
  cleaningRecordId: string;
  changedBy: string;
  changedAt: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

type AuditHistoryResponse = {
  data: AuditEntryResponse[];
};

type CleaningRecordListResponse = {
  data: CleaningRecordResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const equipmentId = uuidv4();
let server: ReturnType<typeof createServer>;
let baseUrl: string;

async function request<T>(path: string, init?: RequestInit): Promise<JsonResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text.length > 0 ? JSON.parse(text) : undefined;

  return {
    status: response.status,
    body,
  } as JsonResponse<T>;
}

async function resetDatabase() {
  await pool.query(`
    TRUNCATE TABLE "AuditEntry", "CleaningRecord", "Equipment"
    RESTART IDENTITY CASCADE;
  `);
}

async function seedEquipment() {
  await pool.query(
    `
      INSERT INTO "Equipment" ("id", "name", "code", "status")
      VALUES ($1, $2, $3, $4);
    `,
    [equipmentId, "Mixing Tank A", `EQ-${equipmentId.slice(0, 8)}`, "ACTIVE"],
  );
}

async function createCleaningRecord(body: Record<string, unknown>) {
  const response = await request<CleaningRecordResponse>(
    `/api/equipment/${equipmentId}/cleaning-records`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  assert.equal(response.status, 201);
  assert.ok(response.body.id);
  return response.body;
}

before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not start on a port");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
  await resetDatabase();
  await seedEquipment();
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await pool.end();
});

test("audit diff records only changed fields and keeps old/new values", async () => {
  const created = await createCleaningRecord({
    cleanedBy: "Asha Patel",
    cleanedAt: "2026-09-10T10:30:00.000Z",
    method: "CIP",
    notes: "Initial clean",
    status: "PENDING",
    changedBy: "Asha Patel",
  });

  const updateResponse = await request<CleaningRecordResponse>(
    `/api/cleaning-records/${created.id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        method: "Manual wash",
        changedBy: "Ravi Kumar",
      }),
    },
  );

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.method, "Manual wash");

  const historyResponse = await request<AuditHistoryResponse>(
    `/api/cleaning-records/${created.id}/audit-history`,
  );

  assert.equal(historyResponse.status, 200);
  assert.equal(historyResponse.body.data.length, 6);

  const methodAudit = historyResponse.body.data.find(
    (entry) =>
      entry.field === "method" &&
      entry.oldValue === "CIP" &&
      entry.newValue === "Manual wash" &&
      entry.changedBy === "Ravi Kumar",
  );

  assert.ok(methodAudit);

  const sameValueUpdate = await request<CleaningRecordResponse>(
    `/api/cleaning-records/${created.id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        method: "Manual wash",
        changedBy: "Ravi Kumar",
      }),
    },
  );

  assert.equal(sameValueUpdate.status, 200);

  const historyAfterNoChange = await request<AuditHistoryResponse>(
    `/api/cleaning-records/${created.id}/audit-history`,
  );

  assert.equal(historyAfterNoChange.status, 200);
  assert.equal(historyAfterNoChange.body.data.length, 6);
});

test("pagination returns the correct page metadata and status filter", async () => {
  await createCleaningRecord({
    cleanedBy: "Asha Patel",
    cleanedAt: "2026-09-10T08:00:00.000Z",
    method: "CIP",
    status: "PENDING",
    changedBy: "Asha Patel",
  });

  await createCleaningRecord({
    cleanedBy: "Ravi Kumar",
    cleanedAt: "2026-09-10T09:00:00.000Z",
    method: "Manual wash",
    status: "VERIFIED",
    changedBy: "Ravi Kumar",
  });

  await createCleaningRecord({
    cleanedBy: "Asha Patel",
    cleanedAt: "2026-09-10T10:00:00.000Z",
    method: "Steam sterilization",
    status: "PENDING",
    changedBy: "Asha Patel",
  });

  const pageOne = await request<CleaningRecordListResponse>(
    `/api/equipment/${equipmentId}/cleaning-records?page=1&limit=2`,
  );

  assert.equal(pageOne.status, 200);
  assert.equal(pageOne.body.pagination.page, 1);
  assert.equal(pageOne.body.pagination.limit, 2);
  assert.equal(pageOne.body.pagination.total, 3);
  assert.equal(pageOne.body.pagination.totalPages, 2);
  assert.equal(pageOne.body.data.length, 2);
  assert.equal(pageOne.body.data[0].cleanedAt, "2026-09-10T10:00:00.000Z");
  assert.equal(pageOne.body.data[1].cleanedAt, "2026-09-10T09:00:00.000Z");

  const pageTwo = await request<CleaningRecordListResponse>(
    `/api/equipment/${equipmentId}/cleaning-records?page=2&limit=2`,
  );

  assert.equal(pageTwo.status, 200);
  assert.equal(pageTwo.body.pagination.page, 2);
  assert.equal(pageTwo.body.pagination.limit, 2);
  assert.equal(pageTwo.body.pagination.total, 3);
  assert.equal(pageTwo.body.pagination.totalPages, 2);
  assert.equal(pageTwo.body.data.length, 1);
  assert.equal(pageTwo.body.data[0].cleanedAt, "2026-09-10T08:00:00.000Z");

  const pendingOnly = await request<CleaningRecordListResponse>(
    `/api/equipment/${equipmentId}/cleaning-records?page=1&limit=10&status=PENDING`,
  );

  assert.equal(pendingOnly.status, 200);
  assert.equal(pendingOnly.body.pagination.total, 2);
  assert.equal(pendingOnly.body.pagination.totalPages, 1);
  assert.equal(pendingOnly.body.data.length, 2);
  assert.ok(pendingOnly.body.data.every((record) => record.status === "PENDING"));
});

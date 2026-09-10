import { Router } from "express";
import {
  createCleaningRecordHandler,
  getCleaningRecordAuditHistoryHandler,
  listCleaningRecordsHandler,
  updateCleaningRecordHandler,
} from "../controllers/cleaning-record.controller.js";

const router = Router();

router.post("/equipment/:equipmentId/cleaning-records", createCleaningRecordHandler);
router.get("/equipment/:equipmentId/cleaning-records", listCleaningRecordsHandler);
router.patch("/cleaning-records/:id", updateCleaningRecordHandler);
router.get("/cleaning-records/:id/audit-history", getCleaningRecordAuditHistoryHandler);

export default router;

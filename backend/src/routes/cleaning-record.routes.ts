import { Router } from "express";
import {
  createCleaningRecordHandler,
  listCleaningRecordsHandler,
  updateCleaningRecordHandler,
} from "../controllers/cleaning-record.controller.js";

const router = Router();

router.post("/equipment/:equipmentId/cleaning-records", createCleaningRecordHandler);
router.get("/equipment/:equipmentId/cleaning-records", listCleaningRecordsHandler);
router.patch("/cleaning-records/:id", updateCleaningRecordHandler);

export default router;

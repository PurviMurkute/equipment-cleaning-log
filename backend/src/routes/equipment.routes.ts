import { Router } from "express";
import {
  createEquipmentHandler,
  deleteEquipmentHandler,
  getEquipment,
  listEquipment,
  updateEquipmentHandler,
} from "../controllers/equipment.controller.js";

const router = Router();

router.get("/", listEquipment);
router.get("/:id", getEquipment);
router.post("/", createEquipmentHandler);
router.patch("/:id", updateEquipmentHandler);
router.delete("/:id", deleteEquipmentHandler);

export default router;

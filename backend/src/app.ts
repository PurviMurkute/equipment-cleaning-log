import express from "express";
import cors from "cors";
import equipmentRoutes from "./routes/equipment.routes.js";
import cleaningRecordRoutes from "./routes/cleaning-record.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/equipment", equipmentRoutes);
app.use("/api", cleaningRecordRoutes);

export default app;

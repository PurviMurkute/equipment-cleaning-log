import express from "express";
import "dotenv/config";
import cors from "cors";
import pool from "./config/db.js";
import equipmentRoutes from "./routes/equipment.routes.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use("/api/equipment", equipmentRoutes);

const startServer = async () => {
  try {
    await pool.query("SELECT 1");

    console.log("PostgreSQL connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    process.exit(1);
  }
};

startServer();

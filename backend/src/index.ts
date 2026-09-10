import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";
const PORT = process.env.PORT || 5001;

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

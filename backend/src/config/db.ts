import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const shouldUseSsl =
  (process.env.DB_HOST ?? "").includes("aivencloud.com") ||
  (connectionString ?? "").includes("aivencloud.com");

const pool = new Pool({
  connectionString,
  host: connectionString ? undefined : process.env.DB_HOST,
  port: connectionString ? undefined : Number(process.env.DB_PORT),
  user: connectionString ? undefined : process.env.DB_USER,
  password: connectionString ? undefined : process.env.DB_PASSWORD,
  database: connectionString ? undefined : process.env.DB_NAME,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
});

export default pool;

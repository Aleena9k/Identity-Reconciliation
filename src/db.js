import mysql from "mysql2/promise";
import "dotenv/config";

console.log("DB File Loaded");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Database Connected Successfully");
    conn.release();
  } catch (err) {
    console.error("❌ Database Connection Failed:", err);
  }
})();

export default pool;
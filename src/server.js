import express from "express";
import identifyRoutes from "./routes.js";
import "dotenv/config";

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use("/identify", identifyRoutes);



app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/create", async (req, res) => {
  try {
    const pool = (await import("./db.js")).default;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phoneNumber VARCHAR(20),
        email VARCHAR(255),
        linkedId INT,
        linkPrecedence ENUM('primary','secondary') DEFAULT 'primary',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt DATETIME NULL
      );
    `);

    res.send("✅ Table created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// ✅ Listen LAST
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
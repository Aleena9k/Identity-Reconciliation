import express from "express";
import identifyRoutes from "./routes.js";
import "dotenv/config";

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use("/identify", identifyRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
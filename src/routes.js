import express from "express";
import { identify } from "./Controller.js";

const router = express.Router();

router.post("/", identify);

export default router;
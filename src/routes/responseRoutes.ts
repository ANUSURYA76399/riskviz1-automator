import express from "express";
import { saveResponse } from "../services/responseService";

const router = express.Router();

router.post("/responses", async (req, res, next) => {
  try {
    const saved = await saveResponse(req.body);
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

export default router;
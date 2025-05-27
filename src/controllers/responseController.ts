import { Request, Response, NextFunction } from "express";
import { saveResponse } from "../services/responseService";

export async function postResponse(req: Request, res: Response, next: NextFunction) {
  try {
    // Basic validation
    const { respondent_id, location, category, timeline, answers } = req.body;
    if (!respondent_id || !location || !category || !timeline || !answers) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const saved = await saveResponse(req.body);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}
import { Router, Request, Response } from "express";
import pool from "../utils/database/db";

const userRouter = Router();

userRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM your_table");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

export default userRouter;
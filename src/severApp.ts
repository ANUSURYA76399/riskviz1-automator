import express from "express"; // ❌ This should be removed from frontend code
import responseRoutes from "./routes/responseRoutes";
import userRouter from "./routes/user";
// or import { getUsers } from "./routes/user"; if you only need the handler

const app = express();

app.use(express.json());
app.use("/api", responseRoutes);
app.use("/api", userRouter);

export default app;
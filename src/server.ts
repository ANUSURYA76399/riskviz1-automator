import app from "./app";
import responseRoutes from "./routes/responseRoutes";

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use("/api", responseRoutes);
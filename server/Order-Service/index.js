import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet"; // Added helmet
import OrderRoutes from "./routes/Orderroutes.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PARAMS = {
    useNewUrlParser: true, 
    useUnifiedTopology: true
};
const URI = process.env.MONGOOSE_URI;
const PORT = process.env.PORT || 5000;

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(helmet()); // Added helmet
app.disable('x-powered-by'); // Disable X-Powered-By header

app.use("/api/order", OrderRoutes);

// Error-handling middleware to prevent detailed error exposure
app.use((err, req, res, next) => {
    console.error(err.stack);  // Log the stack trace for debugging
    const response = process.env.NODE_ENV === 'production'
        ? { message: "An error occurred." }
        : { message: err.message, stack: err.stack };
    res.status(err.status || 500).json(response);
});

mongoose.set("strictQuery", false);
mongoose.connect(URI, PARAMS)
    .then(() => app.listen(PORT, 
        () => console.info(`Order Service running on PORT ${PORT} 🔥`)))
    .catch((err) => console.error(err.message));

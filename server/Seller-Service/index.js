import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import SellerRoutes from "./routes/SellerRoutes.js";
import cookieParser from "cookie-parser";
import helmet from "helmet"; 
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PARAMS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
const URI = process.env.MONGOOSE_URI;
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.disable("x-powered-by");

// CORS Configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','), // Ensure this is set in your .env file
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Routes
app.use("/api/seller", SellerRoutes);

// MongoDB Connection
mongoose.set("strictQuery", false);
mongoose
  .connect(URI, PARAMS)
  .then(() =>
    app.listen(PORT, () =>
      console.info(`Seller Service is running on PORT ${PORT} 🔥`)
    )
  )
  .catch((err) => console.error(err.message));

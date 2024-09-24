import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet"; // Added helmet for security headers
import CartRoute from "./routes/CartRoutes.js";
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
app.use(cookieParser());

// Apply Helmet middleware for setting secure headers
app.use(helmet());

// Disable the 'X-Powered-By' header to reduce information exposure
app.disable('x-powered-by');

// CORS configuration: Restrict to trusted origins
const corsOptions = {
    origin: ['https://yourtrustedwebsite.com'], // Update with trusted domains
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use("/api/checkout", CartRoute);

// Error-handling middleware for safe error reporting
app.use((err, req, res, next) => {
    console.error(err.stack); // Log errors for debugging
    const response = process.env.NODE_ENV === 'production'
        ? { message: "An unexpected error occurred." }
        : { message: err.message, stack: err.stack };
    res.status(err.status || 500).json(response);
});

mongoose.set("strictQuery", false);
mongoose.connect(URI, PARAMS)
    .then(() => app.listen(PORT, 
        () => console.info(`Cart Service running on PORT ${PORT} 🔥`)))
    .catch((err) => console.error(err.message));

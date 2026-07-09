const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFoundHandler");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

// -----------------------------------------------------------------------------
// Security Middleware
// -----------------------------------------------------------------------------
app.use(helmet());

const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:5173"
).split(",");

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
  })
);

// -----------------------------------------------------------------------------
// Body Parsers
// -----------------------------------------------------------------------------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// -----------------------------------------------------------------------------
// Logging
// -----------------------------------------------------------------------------
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// -----------------------------------------------------------------------------
// Root Route
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "E-Commerce Backend API is running successfully.",
    version: "v1",
    health: "/api/v1/health",
  });
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------
app.use("/api/v1/health", healthRoutes);

// Future routes
// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/products", productRoutes);
// app.use("/api/v1/cart", cartRoutes);
// app.use("/api/v1/orders", orderRoutes);

// -----------------------------------------------------------------------------
// Error Handlers (Always Last)
// -----------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
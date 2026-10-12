import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { env } from "./config/env";
import { isAllowedOrigin } from "./middlewares/trusted-origin";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";

const app: Express = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(req, origin)) {
        callback(null, true);
        return;
      }

      callback(Object.assign(new Error("Origin not allowed"), { statusCode: 403 }));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })(req, res, next);
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

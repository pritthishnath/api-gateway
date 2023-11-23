import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3101;
const NODE_ENV = process.env.NODE_ENV || "staging";

app.use(
  morgan(
    `${PORT}|API-GATEWAY :method :url :status :response-time ms - :res[content-length]`
  )
);
app.use(
  cors(
    NODE_ENV === "development"
      ? {
          credentials: true,
          origin: ["http://localhost:5173", "http://localhost:3111"],
        }
      : {
          credentials: true,
          origin: ["https://keeper.pnath.in"],
        }
  )
);
app.use((req, res, next) => {
  res.header("X-Powered-By", "API Gateway @pnath.in");
  next();
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/", router);

app.listen(PORT);

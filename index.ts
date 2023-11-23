import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./routes";

const app = express();
const port = process.env.PORT || 3101;

app.use(
  morgan(
    `${port}|API-GATEWAY :method :url :status :response-time ms - :res[content-length]`
  )
);
app.use(
  cors({
    credentials: true,
    origin: ["https://keeper.pnath.in"],
  })
);
app.use((req, res, next) => {
  res.header("X-Powered-By", "API Gateway @pnath.in");
  next();
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/", router);

app.listen(port);

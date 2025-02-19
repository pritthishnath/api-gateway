import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import authController from "./routes/auth";
import resourceController from "./routes/resource";

// Load environment variables
const PORT = process.env.PORT || 3101;
const NODE_ENV = process.env.NODE_ENV || "development";

new Elysia()
  .state("requestStart", 0)
  .use(cookie())
  .use(
    cors({
      credentials: true,
      origin:
        NODE_ENV === "development"
          ? ["http://localhost:5173", "http://localhost:3111"]
          : ["https://keeper.pnath.in"],
    })
  )
  .onRequest((context) => {
    context.store.requestStart = performance.now();
    context.set.headers["X-Powered-By"] = "API Gateway @pnath.in";
  })
  .onAfterResponse((context) => {
    const end = performance.now();
    const responseTime = end - context.store.requestStart;

    const contentLength = context.set.headers["content-length"] || "-";

    console.log(
      `${PORT}|API-GATEWAY ${context.request.method} ${context.request.url} ${
        context.set.status
      } ${responseTime.toFixed(3)}ms - ${contentLength}`
    );
  })
  // Routes
  .use(authController)
  .use(resourceController)
  .get("/", () => ({ message: "API Gateway running" }))
  .get("/test-log", () => {
    console.log("Test route hit");
    return { message: "Testing logger" };
  })
  .listen(PORT);

console.log(`🦊 Server is running at http://localhost:${PORT}`);

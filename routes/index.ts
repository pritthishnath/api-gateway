import { Router } from "express";
import authController from "./auth";
import resourceController from "./resource";

const router = Router();

router.use("/auth", authController);
router.use("/rs", resourceController);

router.get("/", (req, res) => {
  res.json({ message: "API Gateway running" });
});

export default router;

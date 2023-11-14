import { Router } from "express";
import authController from "./auth";
import resourceController from "./resource";

const router = Router();

router.use("/auth", authController);
router.use("/rs", resourceController);

export default router;

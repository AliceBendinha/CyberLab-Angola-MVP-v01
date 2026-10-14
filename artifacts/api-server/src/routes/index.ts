import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import testRouter from "./test";
import learningRouter from "./learning";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(learningRouter);
router.use(testRouter);

export default router;

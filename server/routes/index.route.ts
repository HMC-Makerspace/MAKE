import { Request, Response, Router } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
    res.sendFile("../../website/build/index.html");
});

export default router;

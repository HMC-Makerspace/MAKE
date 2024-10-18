import { Request, Response, Router } from 'express';

const router = Router();

router.get('/example', (req: Request, res: Response) => {
  res.json({ message: 'This is an example endpoint!' });
});


export default router;
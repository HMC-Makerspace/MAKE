declare namespace Express {
  type User = Express.User & { uuid: string };
}
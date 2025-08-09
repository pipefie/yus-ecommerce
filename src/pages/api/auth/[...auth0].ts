import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "@/lib/auth0";

export default auth0.handleAuth({
  async login(req: NextApiRequest, res: NextApiResponse) {
    try {
      await auth0.handleLogin(req, res, {
        authorizationParams: req.query.connection
          ? { connection: String(req.query.connection) }
          : undefined,
      });
    } catch (error: unknown) {
      const err = error as { status?: number; message: string }
      res.status(err.status || 400).end(err.message);
    }
  },
  async callback(req: NextApiRequest, res: NextApiResponse) {
    try {
      await auth0.handleCallback(req, res);
    } catch (error: unknown) {
      const err = error as { status?: number; message: string }
      res.status(err.status || 400).end(err.message);
    }
  },
  logout: auth0.handleLogout,
  profile: auth0.handleProfile,
});

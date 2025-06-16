// src/app/api/cart/route.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // very naive—store in a cookie
  if (req.method === 'POST') {
    const { variantId, quantity } = req.body;
    const existing = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
    const updated  = [...existing, { variantId, quantity }];
    res.setHeader('Set-Cookie', `cart=${JSON.stringify(updated)}; Path=/; HttpOnly`);
    return res.status(200).json({ cart: updated });
  }
  res.status(405).end();
}

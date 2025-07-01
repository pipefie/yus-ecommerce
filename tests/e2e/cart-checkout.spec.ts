import { NextRequest } from 'next/server'
import { POST } from '../../src/app/api/stripe/checkout/route'
import { stripe } from '../../src/utils/stripe'
import dbConnect from '../../src/utils/dbConnect'
import Order from '../../src/models/Order'

jest.mock('../../src/utils/stripe', () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}))

jest.mock('../../src/utils/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('../../src/models/Order', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}))

process.env.NEXT_PUBLIC_URL = 'http://localhost:3000'

const items = [
  { _id: '1', title: 'Test', imageUrl: '/img.png', price: 1000, quantity: 2 },
]

describe('checkout API', () => {
  it('creates Stripe session and order', async () => {
    const session = {
      id: 'sess_123',
      url: 'https://stripe.test/checkout',
      amount_total: 2000,
      currency: 'usd',
    }
    ;(stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(session)

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/json',
        cookie: 'csrfToken=test',
        'x-csrf-token': 'test',
      }),
      body: JSON.stringify({ items, currency: 'USD', customerEmail: 'a@b.com', userId: 'u1' }),
    })

    const res = await POST(req)
    expect(stripe.checkout.sessions.create).toHaveBeenCalled()
    expect(Order.create).toHaveBeenCalledWith(
      expect.objectContaining({ stripeSessionId: 'sess_123' })
    )
    const data = await res.json()
    expect(data.url).toBe(session.url)
  })
})
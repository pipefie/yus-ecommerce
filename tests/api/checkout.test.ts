import { NextRequest } from 'next/server'
import { POST } from '../../src/app/api/stripe/checkout/route'
import { stripe } from '../../src/utils/stripe'
import { prisma } from '../../src/lib/prisma'
import { getSessionUser } from '../../src/lib/auth/session'

jest.mock('../../src/utils/stripe', () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}))

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    order: { create: jest.fn() },
    product: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}))

jest.mock('../../src/lib/assets', () => ({
  getAssetUrl: jest.fn((value: unknown) => (typeof value === 'string' ? value : null)),
  getAssetUrls: jest.fn((values: unknown[]) => values.filter(Boolean).map(String)),
  assetPlaceholder: jest.fn(() => '/placeholder.png'),
}))

jest.mock('../../src/lib/auth/session', () => ({
  getSessionUser: jest.fn(),
}))

process.env.NEXT_PUBLIC_URL = 'http://localhost:3000'

const items = [
  { _id: '1', title: 'Test', imageUrl: '/img.png', price: 1000, quantity: 2 },
]

describe('checkout API', () => {
  it('creates Stripe session and order', async () => {
    ;(getSessionUser as jest.Mock).mockResolvedValue(null)
    ;(prisma.product.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        slug: '1',
        title: 'Test',
        description: 'desc',
        price: 1000,
        productImages: [],
        variants: [],
      },
    ])
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
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stripeSessionId: 'sess_123' }),
      })
    )
    const data = await res.json()
    expect(data.url).toBe(session.url)
  })
})

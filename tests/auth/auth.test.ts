import bcrypt from 'bcrypt'

jest.mock('@/utils/dbConnect', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/models/User', () => ({ __esModule: true, default: { findOne: jest.fn() } }))
jest.mock('bcrypt', () => ({ __esModule: true, default: { compare: jest.fn() } }))

import dbConnect from '@/utils/dbConnect'
import User from '@/models/User'

describe('auth helpers', () => {
  let authorize: any

  beforeAll(async () => {
    process.env.MONGO_URI = 'mongodb://test'
    const mod = await import('@/lib/auth')
    authorize = (mod.authOptions.providers[0] as any).authorize
  })

  beforeEach(() => {
    ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
  })

  it('returns null when user is not found', async () => {
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    const res = await authorize({ email: 'a@b.com', password: 'pw' })
    expect(res).toBeNull()
  })

  it('returns null with invalid password', async () => {
    ;(User.findOne as jest.Mock).mockResolvedValue({ password: 'hash' })
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
    const res = await authorize({ email: 'a@b.com', password: 'pw' })
    expect(res).toBeNull()
  })
})

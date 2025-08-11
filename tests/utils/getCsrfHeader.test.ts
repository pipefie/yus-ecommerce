import getCsrfHeader from '../../src/utils/getCsrfHeader'

describe('getCsrfHeader', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    ;(global.fetch as jest.Mock).mockReset()
  })

  it('returns header when token present', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'abc' }),
    })
    await expect(getCsrfHeader()).resolves.toEqual({ 'x-csrf-token': 'abc' })
    expect(global.fetch).toHaveBeenCalledWith('/api/csrf-token', { credentials: 'include' })
  })

  it('returns empty object on failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    await expect(getCsrfHeader()).resolves.toEqual({})
  })
})

import { NextRequest } from 'next/server'
import { assertCsrf } from '@/utils/csrf'

describe('assertCsrf', () => {
  it('returns null when tokens match', () => {
    const req = new NextRequest('http://localhost/api', {
      headers: new Headers({
        'x-csrf-token': 'abc',
        cookie: 'csrfToken=abc',
      }),
    })
    const res = assertCsrf(req)
    expect(res).toBeNull()
  })

  it('returns 403 when tokens mismatch', () => {
    const req = new NextRequest('http://localhost/api', {
      headers: new Headers({
        'x-csrf-token': 'abc',
        cookie: 'csrfToken=def',
      }),
    })
    const res = assertCsrf(req)
    expect(res?.status).toBe(403)
  })
})

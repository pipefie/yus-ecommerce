/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import CookieBanner from '@/components/CookieBanner'

jest.mock('react-cookie-consent', () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <button onClick={props.onAccept}>Accept</button>
      <button onClick={props.onDecline}>Decline</button>
    </div>
  ),
}))

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores acceptance choice', async () => {
    render(<CookieBanner />)
    const accept = await screen.findByText('Accept')
    fireEvent.click(accept)
    expect(localStorage.getItem('cookieConsent')).toBe('true')
  })

  it('stores decline choice', async () => {
    render(<CookieBanner />)
    const buttons = await screen.findAllByRole('button')
    fireEvent.click(buttons[1])
    expect(localStorage.getItem('cookieConsent')).toBe('false')
  })
})

describe('Cookie consent and UTM persistence', () => {
  it('stores acceptance of cookies', () => {
    cy.visit('/')
    cy.contains('Accept').click()
    cy.reload()
    cy.window().then((win) => {
      expect(win.localStorage.getItem('cookieConsent')).to.eq('true')
    })
  })

  it('stores rejection of cookies', () => {
    cy.visit('/')
    cy.contains('Decline').click()
    cy.reload()
    cy.window().then((win) => {
      expect(win.localStorage.getItem('cookieConsent')).to.eq('false')
    })
  })

  it.skip('persists UTM parameters', () => {
    cy.visit('/?utm_source=test&utm_medium=cypress')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('utm_source')).to.eq('test')
    })
  })
})

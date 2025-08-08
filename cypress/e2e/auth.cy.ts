describe('Authentication flows', () => {
  it('allows user to sign up with email', () => {
    cy.intercept('POST', '/api/auth/signup', {
      statusCode: 200,
      body: { url: '/auth/signin' },
    }).as('signup')

    cy.visit('/auth/signup')
    cy.get('input[type="text"]').type('Test User')
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('form').submit()
    cy.wait('@signup')
    cy.url().should('include', '/auth/signin')
  })

  it('allows user to sign in with email', () => {
    cy.intercept('POST', '/api/auth/callback/credentials', {
      statusCode: 200,
      body: { url: '/' },
    }).as('signin')

    cy.visit('/auth/signin')
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('form').submit()
    cy.wait('@signin')
  })

  it('initiates Google OAuth flow', () => {
    cy.intercept('GET', '/api/auth/signin/google*', {
      statusCode: 302,
      headers: { location: '/mock-google' },
    }).as('google')

    cy.visit('/auth/signin')
    cy.contains('Continue with Google').click()
    cy.wait('@google')
  })

  it.skip('supports passkey sign in', () => {
    // Passkey flow not implemented
  })
})

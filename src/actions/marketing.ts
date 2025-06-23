'use server'
import fetch from 'node-fetch'

export async function pushCustomerToMailchimp(email: string, name?: string) {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const listId = process.env.MAILCHIMP_LIST_ID
  if (!apiKey || !listId) return
  const dc = apiKey.split('-')[1]
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `apikey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_address: email, status: 'subscribed', merge_fields: { FNAME: name } }),
  }).catch((err) => console.error('Mailchimp signup failed', err))
}

export async function pushOrderToMailchimp(email: string, orderId: string, total: number) {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const storeId = process.env.MAILCHIMP_STORE_ID
  if (!apiKey || !storeId) return
  const dc = apiKey.split('-')[1]
  const url = `https://${dc}.api.mailchimp.com/3.0/ecommerce/stores/${storeId}/orders`
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `apikey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: orderId,
      customer: { email_address: email },
      currency_code: 'USD',
      order_total: total / 100,
    }),
  }).catch((err) => console.error('Mailchimp order failed', err))
}
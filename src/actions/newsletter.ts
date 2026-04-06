'use server'

import { pushCustomerToMailchimp } from './marketing'

export async function subscribeToNewsletterAction(
  _prev: { success: boolean; error: string },
  formData: FormData
): Promise<{ success: boolean; error: string }> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email.' }
  }
  try {
    await pushCustomerToMailchimp(email)
    return { success: true, error: '' }
  } catch {
    return { success: false, error: 'Something went wrong. Try again.' }
  }
}

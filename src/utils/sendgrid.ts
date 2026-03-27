import sgMail from '@sendgrid/mail'
import { env } from '@/lib/env'

function getClient() {
  if (!env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY is not configured')
  sgMail.setApiKey(env.SENDGRID_API_KEY)
  return sgMail
}

export async function sendWelcomeEmail(email: string, name: string) {
  const client = getClient()
  await client.send({
    to: email,
    from: env.SENDGRID_FROM!,
    templateId: env.SENDGRID_WELCOME_TEMPLATE!,
    dynamicTemplateData: { name },
  })
}

export async function sendInvoiceEmail(email: string, pdfBuffer: Buffer, orderId: string) {
  const client = getClient()
  await client.send({
    to: email,
    from: env.SENDGRID_FROM!,
    subject: `Invoice ${orderId}`,
    text: 'Please find your invoice attached.',
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `invoice-${orderId}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  })
}

import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendWelcomeEmail(email: string, name: string) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM!,
    templateId: process.env.SENDGRID_WELCOME_TEMPLATE!,
    dynamicTemplateData: { name },
  }
  await sgMail.send(msg)
}

export async function sendInvoiceEmail(email: string, pdfBuffer: Buffer, orderId: string) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM!,
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
  }
  await sgMail.send(msg)
}
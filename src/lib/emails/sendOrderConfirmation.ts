import { Resend } from 'resend'
import { env } from '@/lib/env'
import logger from '@/lib/logger'

interface OrderLine {
  name: string
  quantity: number
  unitPriceCents: number
  currency: string
}

interface OrderConfirmationParams {
  to: string
  customerName?: string
  orderId: number
  lines: OrderLine[]
  totalCents: number
  currency: string
}

function formatPrice(cents: number, currency: string): string {
  const symbols: Record<string, string> = { eur: '€', usd: '$', gbp: '£' }
  const symbol = symbols[currency.toLowerCase()] ?? currency.toUpperCase() + ' '
  return `${symbol}${(cents / 100).toFixed(2)}`
}

function buildHtml(params: OrderConfirmationParams): string {
  const { customerName, orderId, lines, totalCents, currency } = params
  const greeting = customerName ? `Hey ${customerName.split(' ')[0]},` : 'Hey,'
  const total = formatPrice(totalCents, currency)
  const year = new Date().getFullYear()

  const itemRows = lines
    .map(
      (line) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#cbd5e1;font-size:14px;">
          ${line.name}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:14px;text-align:center;">
          &times;${line.quantity}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:14px;text-align:right;font-weight:600;">
          ${formatPrice(line.unitPriceCents * line.quantity, currency)}
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Order Confirmed — Y-US?</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-family:'Courier New',monospace;font-size:28px;font-weight:900;letter-spacing:0.15em;color:#39ff14;">
                Y-US?
              </span>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:36px 32px;">

              <!-- Heading -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f1f5f9;">
                your drop is confirmed.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;">
                ${greeting} Order <span style="color:#39ff14;font-weight:600;">#${orderId}</span> is in the queue.
              </p>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
                <thead>
                  <tr>
                    <th style="padding:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#475569;text-align:left;border-bottom:1px solid #1e293b;">Item</th>
                    <th style="padding:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#475569;text-align:center;border-bottom:1px solid #1e293b;">Qty</th>
                    <th style="padding:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#475569;text-align:right;border-bottom:1px solid #1e293b;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Total charged</td>
                  <td style="font-size:22px;font-weight:700;color:#f1f5f9;text-align:right;">${total}</td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />

              <!-- Fulfillment message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#042f1e;border:1px solid #14532d;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#4ade80;">
                      We&rsquo;re printing it now.
                    </p>
                    <p style="margin:0;font-size:13px;color:#86efac;line-height:1.5;">
                      Expect dispatch in <strong style="color:#fff;">3&ndash;5 business days</strong>.
                      You&rsquo;ll receive a tracking email the moment it ships.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${env.NEXT_PUBLIC_URL}/products"
                       style="display:inline-block;background:#39ff14;color:#000;font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Shop the drop
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#334155;">
                Questions? Reply to this email or contact us at
                <a href="mailto:support@y-us.store" style="color:#39ff14;text-decoration:none;">support@y-us.store</a>
              </p>
              <p style="margin:0;font-size:11px;color:#1e293b;">
                &copy; ${year} Y-US? &mdash; internet absurdity. wearable form.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendOrderConfirmation(params: OrderConfirmationParams): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not set — skipping order confirmation email')
    return
  }

  const from = env.RESEND_FROM ?? 'Y-US? <orders@y-us.store>'
  const resend = new Resend(env.RESEND_API_KEY)
  const currencyUpper = params.currency.toUpperCase()

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Order confirmed — Y-US? #${params.orderId} (${formatPrice(params.totalCents, params.currency)} ${currencyUpper})`,
    html: buildHtml(params),
  })

  if (error) {
    logger.error({ error, orderId: params.orderId }, 'Failed to send order confirmation email')
  } else {
    logger.info({ orderId: params.orderId, to: params.to }, 'Order confirmation email sent')
  }
}

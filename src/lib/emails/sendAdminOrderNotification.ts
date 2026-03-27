import { Resend } from 'resend'
import { env } from '@/lib/env'
import logger from '@/lib/logger'

interface OrderLine {
  name: string
  quantity: number
  unitPriceCents: number
  currency: string
}

interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state?: string
  country: string
  zip: string
}

interface AdminNotificationParams {
  orderId: number
  customerName?: string
  customerEmail?: string
  lines: OrderLine[]
  totalCents: number
  currency: string
  shippingAddress?: ShippingAddress
}

function formatPrice(cents: number, currency: string): string {
  const symbols: Record<string, string> = { eur: '€', usd: '$', gbp: '£' }
  const symbol = symbols[currency.toLowerCase()] ?? currency.toUpperCase() + ' '
  return `${symbol}${(cents / 100).toFixed(2)}`
}

function buildHtml(p: AdminNotificationParams): string {
  const total = formatPrice(p.totalCents, p.currency)
  const year = new Date().getFullYear()
  const adminUrl = `${env.NEXT_PUBLIC_URL}/admin/orders/${p.orderId}`

  const itemRows = p.lines.map((line) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #1e293b;color:#cbd5e1;font-size:13px;">${line.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;text-align:center;">&times;${line.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px;text-align:right;font-weight:600;">${formatPrice(line.unitPriceCents * line.quantity, line.currency)}</td>
    </tr>`).join('')

  const addr = p.shippingAddress
  const addressBlock = addr ? `
    <p style="margin:0;font-size:13px;color:#cbd5e1;line-height:1.6;">
      ${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}<br/>
      ${addr.city}${addr.state ? ', ' + addr.state : ''} ${addr.zip}<br/>
      ${addr.country.toUpperCase()}
    </p>` : `<p style="margin:0;font-size:13px;color:#64748b;">No address recorded</p>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Order — Y-US? Admin</title></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-family:'Courier New',monospace;font-size:22px;font-weight:900;letter-spacing:0.15em;color:#39ff14;">Y-US? ADMIN</span>
        </td></tr>

        <!-- Alert card -->
        <tr><td style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:32px;">

          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#f1f5f9;">New order received</p>
          <p style="margin:0 0 24px;font-size:13px;color:#64748b;">
            Order <span style="color:#39ff14;font-weight:600;">#${p.orderId}</span> &mdash;
            ${new Date().toLocaleString('en-GB', { timeZone: 'UTC' })} UTC
          </p>

          <!-- Customer -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#0a1628;border:1px solid #1e293b;border-radius:10px;">
            <tr><td style="padding:14px 16px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#475569;">Customer</p>
              <p style="margin:0;font-size:13px;color:#e2e8f0;font-weight:600;">${p.customerName ?? 'Guest'}</p>
              ${p.customerEmail ? `<p style="margin:2px 0 0;font-size:13px;color:#94a3b8;">${p.customerEmail}</p>` : ''}
            </td></tr>
          </table>

          <!-- Items -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr>
                <th style="padding:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#475569;text-align:left;border-bottom:1px solid #1e293b;">Item</th>
                <th style="padding:0 0 8px;font-size:11px;text-transform:uppercase;color:#475569;text-align:center;border-bottom:1px solid #1e293b;">Qty</th>
                <th style="padding:0 0 8px;font-size:11px;text-transform:uppercase;color:#475569;text-align:right;border-bottom:1px solid #1e293b;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Total</td>
              <td style="font-size:20px;font-weight:700;color:#39ff14;text-align:right;">${total}</td>
            </tr>
          </table>

          <hr style="border:none;border-top:1px solid #1e293b;margin:0 0 20px;"/>

          <!-- Shipping -->
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#475569;">Ship to</p>
          ${addressBlock}

          <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0;"/>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${adminUrl}" style="display:inline-block;background:#39ff14;color:#000;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:12px 28px;border-radius:50px;">
                View Order in Admin
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#1e293b;">&copy; ${year} Y-US? Admin Notifications</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendAdminOrderNotification(params: AdminNotificationParams): Promise<void> {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAILS) {
    logger.warn('RESEND_API_KEY or ADMIN_EMAILS not set — skipping admin order notification')
    return
  }

  const recipients = env.ADMIN_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
  if (!recipients.length) return

  const from = env.RESEND_FROM ?? 'Y-US? <orders@y-us.store>'
  const resend = new Resend(env.RESEND_API_KEY)
  const total = formatPrice(params.totalCents, params.currency)

  const { error } = await resend.emails.send({
    from,
    to: recipients,
    subject: `New order #${params.orderId} — ${total} from ${params.customerName ?? params.customerEmail ?? 'Guest'}`,
    html: buildHtml(params),
  })

  if (error) {
    logger.error({ error, orderId: params.orderId }, 'Failed to send admin order notification')
  } else {
    logger.info({ orderId: params.orderId }, 'Admin order notification sent')
  }
}

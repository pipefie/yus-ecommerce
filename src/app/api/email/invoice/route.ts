import { NextRequest, NextResponse } from 'next/server'
import { assertCsrf } from '@/utils/csrf'
import dbConnect from '@/utils/dbConnect'
import Order, { IOrder } from '@/models/Order'
import PDFDocument from 'pdfkit'
import { sendInvoiceEmail } from '@/utils/sendgrid'

export async function POST(req: NextRequest) {
  const csrfError = assertCsrf(req)
  if (csrfError) return csrfError

  const { orderId, email } = await req.json()
  await dbConnect()
  const order = await Order.findById(orderId).lean()
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const doc = new PDFDocument()
  const chunks: Buffer[] = []
  doc.on('data', (c) => chunks.push(c))
  const pdfPromise = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(20).text('Invoice', { underline: true });
  doc.moveDown();
  doc.text(`Order ID: ${order._id}`);
  doc.text(`Total: ${(order.totalAmount / 100).toFixed(2)} ${order.currency}`);
  doc.moveDown();
  doc.text('Items:');
  (order.items as IOrder['items']).forEach((item) => {
    doc.text(`- ${item.productId}: ${item.quantity} x ${(item.price / 100).toFixed(2)}`)
  });
  doc.end()
  const pdf = await pdfPromise
  await sendInvoiceEmail(email, pdf, orderId)
  return NextResponse.json({ ok: true })
}
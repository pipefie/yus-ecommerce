// src/app/sitemap.xml/route.ts
import { getAllProducts } from '@/lib/products'

export const revalidate = 86400 // 24 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const products = await getAllProducts()
  const urls = products
    .map((p) => `<url><loc>${baseUrl}/products/${p.slug}</loc></url>`) 
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${baseUrl}</loc></url>${urls}</urlset>`
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
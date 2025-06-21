import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/utils/dbConnect'
import Review from '../../../models/Review'

export async function GET(req: NextRequest) {
  await dbConnect()
  const productSlug = req.nextUrl.searchParams.get('productId')
  const query = productSlug ? { productSlug } : {}
  const reviews = await Review.find(query).sort({ createdAt: -1 }).lean()
  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  await dbConnect()
  const review = await Review.create({
    productSlug: data.productId,
    author: data.author,
    rating: data.rating,
    comment: data.comment
  })
  return NextResponse.json(review)
}
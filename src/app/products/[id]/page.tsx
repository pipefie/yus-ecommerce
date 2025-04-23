// src/app/products/[id]/page.tsx
import { notFound } from 'next/navigation'
import dbConnect from '@/utils/dbConnect'
import Product, { IProduct } from '@/models/Product'
import NSFWBlock from '@/components/NSFWBlock'
import { Metadata } from "next"

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    await dbConnect()
    const prod = (await Product.findById(params.id).lean()) as IProduct | null
    if (!prod) {
      return { title: "Product Not Found – Y_US?", description: "" }
    }
    // Ensure we have a string (never undefined)
    const description = prod.description ?? ""
    // Optionally supply a default/fallback image
    const image = prod.imageUrl ?? "/default-og.png"

    const metadata: Metadata = {
        title: `${prod.title} | Y_US?`,
        description: description.slice(0, 160),
        openGraph: {
        title: prod.title,
        description: description.slice(0, 160),
        images: [image],      // now always a string, never undefined
        },
    }

    return metadata
}

export default async function ProductDetailPage({ params }: Props) {
  await dbConnect()
  const prod = await Product.findById(params.id).lean()
  if (!prod) notFound()

  return (
    <div className="container mx-auto py-12">
      <h1 className="font-pixel text-5xl mb-6">{prod.title}</h1>

      {prod.nsfw ? (
        <NSFWBlock>
          <img
            src={prod.imageUrl}
            alt={prod.title}
            className="w-full max-w-md mx-auto rounded-lg"
          />
        </NSFWBlock>
      ) : (
        <img
          src={prod.imageUrl}
          alt={prod.title}
          className="w-full max-w-md mx-auto rounded-lg"
        />
      )}

      <p className="mt-6 text-gray-700">{prod.description}</p>
      <p className="mt-4 font-bold text-2xl">${prod.price.toFixed(2)}</p>
      {/* Add “Add to Cart” button here */}
    </div>
  )
}

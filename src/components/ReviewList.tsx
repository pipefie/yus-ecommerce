"use client"
import { useState } from 'react'
import useSWR from 'swr'

interface Review {
  _id: string
  author: string
  rating: number
  comment: string
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<Review[]>)

export default function ReviewList({ productId }: { productId: string }) {
  const { data: reviews = [], mutate } = useSWR<Review[]>(`/api/reviews?productId=${productId}`, fetcher)
  const [author, setAuthor] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(5)

  const handleSubmit = async () => {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, author, comment, rating })
    })
    setAuthor('')
    setComment('')
    mutate()
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Reviews</h3>
      <ul className="space-y-2">
        {reviews.map(r => (
          <li key={r._id} className="border-b pb-2">
            <div className="text-sm font-medium">{r.author} – {r.rating}/5</div>
            <div className="text-sm">{r.comment}</div>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2">
        <input className="w-full border p-2" placeholder="Name" value={author} onChange={e=>setAuthor(e.target.value)} />
        <textarea className="w-full border p-2" placeholder="Write a review" value={comment} onChange={e=>setComment(e.target.value)} />
        <select className="border p-2" value={rating} onChange={e=>setRating(Number(e.target.value))}>
          {[1,2,3,4,5].map(n=> <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded">Submit</button>
      </div>
    </div>
  )
}
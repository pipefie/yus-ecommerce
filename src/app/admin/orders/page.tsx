import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/admin/orders`)
  const orders = await res.json()
  return (
    <div className="pt-16 container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>
      <pre>{JSON.stringify(orders, null, 2)}</pre>
    </div>
  )
}
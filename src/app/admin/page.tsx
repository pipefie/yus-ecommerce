import auth0 from "@/lib/auth0"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await auth0.getSession()
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    redirect("/")
  }
  return (
    <div className="pt-16 min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p>Only admins can see this page.</p>
      </div>
    </div>
  )
}
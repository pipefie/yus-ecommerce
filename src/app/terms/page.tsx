export const metadata = { title: "Terms & Conditions" }
export const revalidate = 60
export default function TermsPage() {
  return (
    <div className="pt-16 container mx-auto px-4 text-white">
      <h1 className="font-pixel text-3xl mb-4">Terms & Conditions</h1>
      <p>Use of this site is subject to standard ecommerce terms and conditions.</p>
    </div>
  )
}
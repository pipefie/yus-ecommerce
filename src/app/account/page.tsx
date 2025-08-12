// src/app/account/page.tsx
import { redirect } from "next/navigation";
import auth0 from "@/lib/auth0";

export default async function AccountPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/signin?returnTo=/account");
  const { user } = session;

  return (
    <main className="min-h-screen bg-black text-white px-6 pt-28">
      <div className="max-w-2xl mx-auto bg-black/70 backdrop-blur rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-pixel mb-4">Your Profile</h1>
        <div className="space-y-2">
          {user.name &&  <p><span className="text-white/60">Name:</span> {user.name}</p>}
          {user.email && <p><span className="text-white/60">Email:</span> {user.email}</p>}
        </div>
        <div className="mt-6">
          <a href="/auth/logout?returnTo=/" className="inline-block rounded-xl py-2 px-4 bg-white/10 hover:bg-white/20 transition font-pixel">
            Sign out
          </a>
        </div>
      </div>
    </main>
  );
}

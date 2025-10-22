import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    prompt?: string;
    error?: string;
  }>;
};

function safeReturnTo(value: string | undefined): string {
  if (!value) return "/";
  if (value.startsWith("http")) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getSessionUser();
  const returnTo = safeReturnTo(params?.returnTo);
  if (user) {
    redirect(returnTo);
  }

  const errorCode = params?.error;
  const mode = params?.prompt === "signup" ? "signup" : "login";

  const loginHref = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const signupHref = `/auth/login?returnTo=${encodeURIComponent(returnTo)}&prompt=signup`;
  const primaryHref = mode === "signup" ? signupHref : loginHref;
  const secondaryHref = mode === "signup" ? loginHref : signupHref;
  const primaryLabel = mode === "signup" ? "Create a new account" : "Sign in with OIDC";
  const secondaryLabel = mode === "signup" ? "Use existing account" : "Create a new account";
  const heading = mode === "signup" ? "Create your account" : "Welcome back";
  const subHeading =
    mode === "signup"
      ? "Join the Y-US? community and unlock members-only drops."
      : "Sign in with your trusted identity provider. Passkeys work best on browsers that support WebAuthn.";

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl bg-black/70 backdrop-blur p-10 shadow-neon border border-white/10 space-y-8">
        <div className="flex items-center justify-center">
          <Image src="/logoWhite.png" alt="Y_US? Logo" width={80} height={80} priority />
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-pixel tracking-wide">{heading}</h1>
          <p className="text-white/70 text-sm">{subHeading}</p>
          {errorCode && (
            <p className="text-sm text-red-400">
              Something went wrong ({errorCode}). Please try again.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href={primaryHref}
            className="block w-full text-center rounded-xl py-3 bg-neon/90 hover:bg-neon transition font-pixel"
          >
            {primaryLabel}
          </a>
          <a
            href={secondaryHref}
            className="block w-full text-center rounded-xl py-3 bg-white/10 hover:bg-white/20 transition font-pixel"
          >
            {secondaryLabel}
          </a>
          <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-left">
            <p className="font-semibold text-white/80 mb-1">Passkey tip</p>
            <p className="text-white/60">
              Add a passkey in your identity provider after signing in. On supported devices you will see &quot;Use passkey&quot; on your next visit.
            </p>
          </div>
        </div>

        <div className="flex justify-between text-xs text-white/40">
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/">Continue as guest</Link>
        </div>
      </div>
    </main>
  );
}
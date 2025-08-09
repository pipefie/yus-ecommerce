import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="space-y-4">
        <Button onClick={() => (window.location.href = "/api/auth/login?connection=google-oauth2")}> 
          Continue with Google
        </Button>
        <Button onClick={() => (window.location.href = "/api/auth/login?connection=webauthn-platform")}> 
          Continue with Passkey
        </Button>
      </div>
    </div>
  );
}

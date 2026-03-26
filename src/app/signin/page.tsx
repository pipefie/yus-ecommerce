import { redirect } from "next/navigation";

type SignInProps = { searchParams: Promise<{ returnTo?: string }> };

export default async function SignIn({ searchParams }: SignInProps) {
  const params = await searchParams;
  const returnTo = params?.returnTo ?? "/";
  redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
}
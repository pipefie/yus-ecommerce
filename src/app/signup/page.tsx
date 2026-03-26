import { redirect } from "next/navigation";

type SignUpProps = { searchParams: Promise<{ returnTo?: string }> };

export default async function SignUp({ searchParams }: SignUpProps) {
  const params = await searchParams;
  const returnTo = params?.returnTo ?? "/";
  redirect(`/login?prompt=signup&returnTo=${encodeURIComponent(returnTo)}`);
}
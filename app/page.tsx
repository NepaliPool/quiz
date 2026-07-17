import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { LandingPage } from "@/modules/landing/components/landing-page";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: pageParam }, session] = await Promise.all([
    searchParams,
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);

  const page = Math.max(1, Number(pageParam) || 1);

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null;

  return <LandingPage user={user} page={page} />;
}

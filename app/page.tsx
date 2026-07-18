import type { Metadata } from "next";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { absoluteUrl, createPageMetadata, siteConfig } from "@/lib/seo";
import { LandingPage } from "@/modules/landing/components/landing-page";

export const metadata: Metadata = createPageMetadata({
  description: siteConfig.description,
  path: "/",
});

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/brand/quizdesk-logo.svg"),
        description: siteConfig.description,
      },
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
        },
      },
      {
        "@type": "WebApplication",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        description: siteConfig.description,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage user={user} page={page} />
    </>
  );
}

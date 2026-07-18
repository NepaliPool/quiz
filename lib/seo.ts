import type { Metadata } from "next";

export const siteConfig = {
  name: "QuizDesk",
  tagline: "Faculty-first quiz delivery",
  description:
    "Browse faculties, unlock quiz sets with one-time access codes, and get subject-wise marks — built for faculty-managed assessments.",
  keywords: [
    "QuizDesk",
    "online quiz",
    "faculty quiz",
    "access code quiz",
    "MCQ exam",
    "subject-wise marks",
    "quiz platform",
  ],
} as const;

export function getSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim();

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_APP_URL or BETTER_AUTH_URL must be configured",
      );
    }
    return "http://localhost:3000";
  }

  const url = new URL(configured);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Application URL must use HTTP or HTTPS");
  }

  return url.toString().replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetaInput = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
};

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
  image,
}: PageMetaInput = {}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;

  return {
    title: title ?? {
      absolute: `${siteConfig.name} — ${siteConfig.tagline}`,
    },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      ...(image
        ? {
            images: [
              {
                url: image,
                alt: fullTitle,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
  };
}

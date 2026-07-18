import type { MetadataRoute } from "next";

import {
  getSitemapFacultyRoutes,
  getSitemapQuizSetRoutes,
} from "@/dal/public/get-sitemap-routes";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [faculties, quizSets] = await Promise.all([
    getSitemapFacultyRoutes(),
    getSitemapQuizSetRoutes(),
  ]);

  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...faculties.map((faculty) => ({
      url: absoluteUrl(`/faculty/${faculty.slug}`),
      lastModified: faculty.updatedAt ?? now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...quizSets.map((set) => ({
      url: absoluteUrl(`/faculty/${set.facultySlug}/${set.quizSetSlug}`),
      lastModified: set.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

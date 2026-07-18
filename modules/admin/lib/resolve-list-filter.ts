import { slugify } from "@/lib/slugify";

type FacultyLike = { id: string; slug: string };
type SubjectLike = { id: string; name: string; facultyId: string };

/** Resolve a URL faculty param (slug, or legacy id) to a faculty id. */
export function resolveFacultyId(
  param: string,
  faculties: FacultyLike[],
): string {
  if (!param || param === "all") {
    return "all";
  }

  const bySlug = faculties.find((faculty) => faculty.slug === param);
  if (bySlug) {
    return bySlug.id;
  }

  const byId = faculties.find((faculty) => faculty.id === param);
  return byId?.id ?? "all";
}

/** Resolve a URL subject param (slugified name, or legacy id) to a subject id. */
export function resolveSubjectId(
  param: string,
  subjects: SubjectLike[],
  facultyId: string = "all",
): string {
  if (!param || param === "all") {
    return "all";
  }

  const scoped =
    facultyId === "all"
      ? subjects
      : subjects.filter((subject) => subject.facultyId === facultyId);

  const bySlug = scoped.find(
    (subject) => slugify(subject.name) === param,
  );
  if (bySlug) {
    return bySlug.id;
  }

  const byId = scoped.find((subject) => subject.id === param);
  if (byId) {
    return byId.id;
  }

  // Legacy URL with subject id while faculty filter is "all"
  if (facultyId === "all") {
    const byIdAny = subjects.find((subject) => subject.id === param);
    return byIdAny?.id ?? "all";
  }

  return "all";
}

export function subjectParamValue(name: string) {
  return slugify(name);
}

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

type QuizSetLike = {
  id: string;
  slug: string;
  facultySlug: string;
};

/** URL value for a quiz set filter: facultySlug/quizSlug */
export function quizSetParamValue(quizSet: QuizSetLike) {
  return `${quizSet.facultySlug}/${quizSet.slug}`;
}

/** Resolve a URL quiz param (faculty/slug, bare slug, or legacy id) to a quiz set id. */
export function resolveQuizSetId(
  param: string,
  quizSets: QuizSetLike[],
): string {
  if (!param || param === "all") {
    return "all";
  }

  const byComposite = quizSets.find(
    (quizSet) => quizSetParamValue(quizSet) === param,
  );
  if (byComposite) {
    return byComposite.id;
  }

  const bySlug = quizSets.filter((quizSet) => quizSet.slug === param);
  if (bySlug.length === 1) {
    return bySlug[0]!.id;
  }

  const byId = quizSets.find((quizSet) => quizSet.id === param);
  return byId?.id ?? "all";
}


export type UsersListFilters = {
  q: string;
  role: string;
  page: number;
};

export type AccessCodesListFilters = {
  q: string;
  status: string;
  quizSetId: string;
  page: number;
};

export type QuizSetsListFilters = {
  q: string;
  facultyId: string;
  subjectId: string;
  page: number;
};

export type FacultiesListFilters = {
  q: string;
  page: number;
};

export type SubjectsListFilters = {
  q: string;
  facultyId: string;
  page: number;
};

export const adminKeys = {
  all: ["admin"] as const,
  usersRoot: () => [...adminKeys.all, "users"] as const,
  users: (filters: UsersListFilters) =>
    [...adminKeys.usersRoot(), filters] as const,
  accessCodesRoot: () => [...adminKeys.all, "access-codes"] as const,
  accessCodes: (filters: AccessCodesListFilters) =>
    [...adminKeys.accessCodesRoot(), filters] as const,
  quizSetsRoot: () => [...adminKeys.all, "quiz-sets"] as const,
  quizSets: (filters: QuizSetsListFilters) =>
    [...adminKeys.quizSetsRoot(), filters] as const,
  facultiesRoot: () => [...adminKeys.all, "faculties"] as const,
  faculties: (filters: FacultiesListFilters) =>
    [...adminKeys.facultiesRoot(), filters] as const,
  subjectsRoot: () => [...adminKeys.all, "subjects"] as const,
  subjects: (filters: SubjectsListFilters) =>
    [...adminKeys.subjectsRoot(), filters] as const,
};

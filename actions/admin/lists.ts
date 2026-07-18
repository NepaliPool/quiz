"use server";

import { assertAdmin } from "@/dal/admin/require-admin";
import {
  getAccessCodes,
  type AccessCodeListResult,
  type AccessCodeStatus,
} from "@/dal/admin/get-access-codes";
import {
  getFaculties,
  type FacultyListResult,
} from "@/dal/admin/get-faculties";
import {
  getQuizSets,
  type QuizSetListResult,
} from "@/dal/admin/get-quiz-sets";
import {
  getSubjects,
  type SubjectListResult,
} from "@/dal/admin/get-subjects";
import { getUsers, type UserListResult } from "@/dal/admin/get-users";

export async function listUsers(input: {
  q?: string;
  role?: string;
  page?: number;
}): Promise<UserListResult> {
  await assertAdmin();
  return getUsers({ ...input, skipAuth: true });
}

export async function listAccessCodes(input: {
  q?: string;
  status?: "all" | AccessCodeStatus;
  quizSetId?: string;
  page?: number;
}): Promise<AccessCodeListResult> {
  await assertAdmin();
  return getAccessCodes({ ...input, skipAuth: true });
}

export async function listQuizSets(input: {
  q?: string;
  facultyId?: string;
  subjectId?: string;
  page?: number;
}): Promise<QuizSetListResult> {
  await assertAdmin();
  return getQuizSets({ ...input, skipAuth: true });
}

export async function listFaculties(input: {
  q?: string;
  page?: number;
}): Promise<FacultyListResult> {
  await assertAdmin();
  return getFaculties({ ...input, skipAuth: true });
}

export async function listSubjects(input: {
  q?: string;
  facultyId?: string;
  page?: number;
}): Promise<SubjectListResult> {
  await assertAdmin();
  return getSubjects({ ...input, skipAuth: true });
}

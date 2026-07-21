const PREFIX = "qd_mock_attempt_";

function cookieName(quizSetId: string) {
  return `${PREFIX}${quizSetId}`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(name.length + 1)) || null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") {
    return;
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.max(1, Math.floor(maxAgeSeconds))}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Read in-progress free-mock attempt id for this quiz set (browser-scoped). */
export function getMockAttemptCookie(quizSetId: string) {
  return readCookie(cookieName(quizSetId));
}

/**
 * Persist attempt id. Prefer remaining time until deadline when known;
 * otherwise fall back to full duration + buffer.
 */
export function setMockAttemptCookie(
  quizSetId: string,
  attemptId: string,
  {
    durationMinutes,
    deadlineAt,
  }: {
    durationMinutes: number;
    deadlineAt?: string;
  },
) {
  let maxAgeSeconds = Math.max(60, durationMinutes * 60 + 120);

  if (deadlineAt) {
    const remainingSeconds =
      Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 1000) + 120;
    maxAgeSeconds = Math.max(60, remainingSeconds);
  }

  writeCookie(cookieName(quizSetId), attemptId, maxAgeSeconds);
}

export function clearMockAttemptCookie(quizSetId: string) {
  clearCookie(cookieName(quizSetId));
}

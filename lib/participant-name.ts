/** Normalize student name for shared free-mock attempts (display key; not unique). */
export function normalizeParticipantNameKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function formatParticipantName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

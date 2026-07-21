export type MockLeaderboardEntry = {
  sn: number;
  maskedCode: string;
  marks: number;
};

export type MockLeaderboardBoard = {
  id: string;
  title: string;
  subtitle: string;
  entries: MockLeaderboardEntry[];
};

/** Deterministic PRNG so SSR and client match. */
function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function maskAccessCode(code: string) {
  const prefix = code.slice(0, 3).toLowerCase();
  return `${prefix}****`;
}

function buildEntries(seed: number, count: number): MockLeaderboardEntry[] {
  const rand = mulberry32(seed);
  const prefixes = [
    "SHD",
    "MGT",
    "ENG",
    "KHA",
    "KAA",
    "FST",
    "QDZ",
    "PUM",
    "SET",
    "ADM",
  ];

  const marks: number[] = [];
  for (let i = 0; i < count; i += 1) {
    // 30–139 — stays well under 150, top scores land near high 120s–low 130s.
    const value = 30 + Math.floor(rand() * 110);
    marks.push(Math.min(139, value));
  }

  marks.sort((a, b) => b - a);

  // Cap the podium so nothing sits near a full 150.
  if (marks[0] !== undefined) {
    marks[0] = Math.min(marks[0], 139);
  }
  if (marks[1] !== undefined) {
    marks[1] = Math.min(marks[1], 128);
  }
  if (marks[2] !== undefined) {
    marks[2] = Math.min(marks[2], 124);
  }

  marks.sort((a, b) => b - a);

  return marks.map((score, index) => {
    const prefix = prefixes[Math.floor(rand() * prefixes.length)]!;
    const suffix = String(1000 + Math.floor(rand() * 9000));
    const code = `${prefix}-${suffix}`;

    return {
      sn: index + 1,
      maskedCode: maskAccessCode(code),
      marks: score,
    };
  });
}

export const MOCK_LEADERBOARD_BOARDS: MockLeaderboardBoard[] = [
  {
    id: "management",
    title: "Management",
    subtitle: "Faculty of Management / Science and Technology 'Kha'",
    entries: buildEntries(20260721, 40),
  },
  {
    id: "engineering",
    title: "Engineering",
    subtitle: "Science and Technology 'Ka'",
    entries: buildEntries(20260722, 40),
  },
];

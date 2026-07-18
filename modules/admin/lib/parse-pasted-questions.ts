export type ParsedQuestionOption = {
  label: string;
  isCorrect: boolean;
};

export type ParsedQuestion = {
  prompt: string;
  options: ParsedQuestionOption[];
};

export type ParsePastedQuestionsError = {
  questionIndex: number | null;
  message: string;
};

export type ParsePastedQuestionsResult = {
  questions: ParsedQuestion[];
  errors: ParsePastedQuestionsError[];
};

const QUESTION_START =
  /^(?:Q(?:uestion)?\s*\d*\s*[:.)-]\s*|\d+\s*[.)]\s+)/i;
const OPTION_LINE = /^([A-D])\s*[).:-]\s*(.+)$/i;
const CORRECT_LINE = /^(?:correct|answer)\s*[:.=-]?\s*([A-D])\s*$/i;
const CORRECT_MARKER = /(?:\*|✓|\(correct\)|\(answer\))\s*$/i;

export const PASTE_QUESTIONS_FORMAT_HELP = `1. Complete the analogy.

Book : Library :: Patient : ?
a. School
b. Hospital*
c. Office
d. Market

2. Choose the odd one out.
a. Rose
b. Lily
c. Lotus
d. Mango*

Q: What is the capital of France?
A) London
B) Berlin
C) Paris *
D) Madrid`;

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function isCorrectMarker(raw: string) {
  return CORRECT_MARKER.test(raw);
}

function stripCorrectMarker(raw: string) {
  return raw.replace(CORRECT_MARKER, "").trim();
}

/**
 * Clean common math-copy artifacts from ChatGPT / rendered LaTeX pastes.
 * e.g. `764\frac{7}{64}647` → `7/64`, bare `\frac{15}{16}` → `15/16`
 * Preserves newlines so multi-line stems stay intact.
 */
export function normalizeMathPaste(text: string): string {
  let result = text.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // {num}{den}\frac{num}{den}{den}{num}  (digits duplicated around LaTeX)
  result = result.replace(
    /(\d+)(\d+)\\frac\{\1\}\{\2\}\2\1/g,
    "$1/$2",
  );

  // Remaining plain LaTeX fractions
  result = result.replace(/\\frac\{(-?\d+)\}\{(-?\d+)\}/g, "$1/$2");

  return result
    .split("\n")
    .map((line) => line.replace(/\s{2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Parse bulk-pasted MCQ text into question drafts.
 *
 * Supported shapes:
 *   1. Instruction line
 *
 *   Stem / analogy line
 *   a. option
 *   b. option*
 *   c. option
 *   d. option
 *
 *   Q: prompt
 *   A) option
 *   B) option *
 *   C) option
 *   D) option
 *
 * Exactly 4 options (A–D). Mark the correct option with `*` (or ✓ / (correct)).
 * Optionally end a block with `Correct: C`.
 * Extra prompt lines (before options) are kept as separate lines in the prompt.
 */
export function parsePastedQuestions(raw: string): ParsePastedQuestionsResult {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const questions: ParsedQuestion[] = [];
  const errors: ParsePastedQuestionsError[] = [];

  type Draft = {
    sourceIndex: number;
    prompt: string;
    options: Array<{ letter: string; label: string; isCorrect: boolean }>;
    correctLetter: string | null;
  };

  let current: Draft | null = null;
  let nextSourceIndex = 1;

  function flush() {
    if (!current) return;

    const questionIndex = current.sourceIndex;
    const prompt = normalizeMathPaste(current.prompt);

    if (!prompt) {
      errors.push({
        questionIndex,
        message: `Question ${questionIndex} is missing a prompt.`,
      });
      current = null;
      return;
    }

    if (current.options.length !== 4) {
      errors.push({
        questionIndex,
        message: `Question ${questionIndex} must have exactly 4 options (A–D). Found ${current.options.length}.`,
      });
      current = null;
      return;
    }

    const letters = current.options.map((option) => option.letter);
    if (letters.join("") !== "ABCD") {
      errors.push({
        questionIndex,
        message: `Question ${questionIndex} options must be A, B, C, D in order.`,
      });
      current = null;
      return;
    }

    let options = current.options.map((option) => ({
      label: normalizeMathPaste(option.label),
      isCorrect: option.isCorrect,
    }));

    if (current.correctLetter) {
      options = options.map((option, index) => ({
        ...option,
        isCorrect:
          String.fromCharCode(65 + index) === current!.correctLetter,
      }));
    }

    const correctCount = options.filter((option) => option.isCorrect).length;
    if (correctCount !== 1) {
      errors.push({
        questionIndex,
        message:
          correctCount === 0
            ? `Question ${questionIndex} needs a correct answer (mark with * or add Correct: A).`
            : `Question ${questionIndex} has ${correctCount} correct answers; mark exactly one.`,
      });
      current = null;
      return;
    }

    for (const [index, option] of options.entries()) {
      if (!option.label.trim()) {
        errors.push({
          questionIndex,
          message: `Question ${questionIndex} option ${String.fromCharCode(65 + index)} is empty.`,
        });
        current = null;
        return;
      }
    }

    questions.push({ prompt, options });
    current = null;
  }

  for (const line of lines) {
    const correctMatch = line.match(CORRECT_LINE);
    if (correctMatch && current) {
      current.correctLetter = correctMatch[1]!.toUpperCase();
      continue;
    }

    const optionMatch = line.match(OPTION_LINE);
    if (optionMatch && current) {
      const letter = optionMatch[1]!.toUpperCase();
      const rawLabel = optionMatch[2] ?? "";
      const marked = isCorrectMarker(rawLabel);
      current.options.push({
        letter,
        label: stripCorrectMarker(rawLabel),
        isCorrect: marked,
      });
      continue;
    }

    if (QUESTION_START.test(line) || !current) {
      flush();
      current = {
        sourceIndex: nextSourceIndex,
        prompt: line.replace(QUESTION_START, "").trim() || line,
        options: [],
        correctLetter: null,
      };
      nextSourceIndex += 1;
      continue;
    }

    // Continuation of the prompt (multi-line question text).
    if (current.options.length === 0) {
      current.prompt = `${current.prompt}\n${line}`.trim();
      continue;
    }

    errors.push({
      questionIndex: current.sourceIndex,
      message: `Unexpected line in question ${current.sourceIndex}: "${line}"`,
    });
  }

  flush();

  if (questions.length === 0 && errors.length === 0) {
    errors.push({
      questionIndex: null,
      message: "No questions found. Paste text using the format shown below.",
    });
  }

  return { questions, errors };
}

export function parsedQuestionsToDrafts(
  questions: ParsedQuestion[],
): Array<{
  id: string;
  prompt: string;
  marks: number;
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
}> {
  return questions.map((question) => ({
    id: newId("q"),
    prompt: question.prompt,
    marks: 1,
    options: question.options.map((option, index) => ({
      id: newId(`opt-${index + 1}`),
      label: option.label,
      isCorrect: option.isCorrect,
    })),
  }));
}

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

export const PASTE_QUESTIONS_FORMAT_HELP = `Q: What is the capital of France?
A) London
B) Berlin
C) Paris *
D) Madrid

Q: 2 + 2 equals?
A) 3
B) 4 *
C) 5
D) 22`;

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function isCorrectMarker(raw: string) {
  return /\*|✓|\(correct\)|\(answer\)/i.test(raw);
}

function stripCorrectMarker(raw: string) {
  return raw
    .replace(/\s*(?:\*|✓|\(correct\)|\(answer\))\s*$/i, "")
    .trim();
}

/**
 * Parse bulk-pasted MCQ text into question drafts.
 * Expected shape per question:
 *   Q: prompt
 *   A) option
 *   B) option *
 *   C) option
 *   D) option
 * Exactly 4 options (A–D). Mark the correct option with `*` (or ✓ / (correct)).
 * Optionally end a block with `Correct: C`.
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
    prompt: string;
    options: Array<{ letter: string; label: string; isCorrect: boolean }>;
    correctLetter: string | null;
  };

  let current: Draft | null = null;

  function flush() {
    if (!current) return;

    const questionIndex = questions.length + 1;
    const prompt = current.prompt.trim();

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
      label: option.label,
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
      const marked = isCorrectMarker(line);
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
        prompt: line.replace(QUESTION_START, "").trim() || line,
        options: [],
        correctLetter: null,
      };
      continue;
    }

    // Continuation of the prompt (multi-line question text).
    if (current.options.length === 0) {
      current.prompt = `${current.prompt} ${line}`.trim();
      continue;
    }

    errors.push({
      questionIndex: questions.length + 1,
      message: `Unexpected line in question ${questions.length + 1}: "${line}"`,
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
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
}> {
  return questions.map((question) => ({
    id: newId("q"),
    prompt: question.prompt,
    options: question.options.map((option, index) => ({
      id: newId(`opt-${index + 1}`),
      label: option.label,
      isCorrect: option.isCorrect,
    })),
  }));
}

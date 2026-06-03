const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Minimal structural types so this util stays decoupled from the `@/types`
// path alias (which keeps it importable from plain test runners).
type OrderableQuestion = { id: number; section: string; difficulty: string };
type OrderableTest = { id: string; questions: OrderableQuestion[] };
type OrderableResult = { testId: string; questionAttempts?: { questionId: number }[] };

export const buildQuestionOrder = (
  test: OrderableTest,
  sections: string[],
  difficulties: string[],
  testResults: OrderableResult[],
  shuffleEnabled: boolean,
  orderMode: "latest" | "earliest" | "random",
) => {
  const exposureMap: Record<number, number> = {};
  testResults
    .filter((result) => result.testId === test.id)
    .forEach((result) => {
      result.questionAttempts?.forEach((qa) => {
        exposureMap[qa.questionId] = (exposureMap[qa.questionId] || 0) + 1;
      });
    });

  const selected = test.questions.filter(
    (q) =>
      (sections.length === 0 || sections.includes(q.section)) &&
      (difficulties.length === 0 || difficulties.includes(q.difficulty)),
  );

  if (selected.length === 0) {
    if (sections.length === 0 && difficulties.length === 0) {
      return shuffleEnabled ? shuffle(test.questions.map((q) => q.id)) : test.questions.map((q) => q.id);
    }
    return [];
  }

  // If user explicitly requests random ordering, ignore exposure grouping
  // and just shuffle the selected pool.
  if (orderMode === "random") {
    return shuffle(selected.map((q) => q.id));
  }

  if (!shuffleEnabled) {
    // Preserve original order, no exposure-prioritization.
    const ids = selected.map((q) => q.id);
    return orderMode === "latest" ? ids.slice().reverse() : ids;
  }

  const groups: Record<number, number[]> = {};
  selected.forEach((q) => {
    const count = exposureMap[q.id] || 0;
    groups[count] = groups[count] || [];
    groups[count].push(q.id);
  });

  const sortedExposureLevels = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  // Within each exposure group we shuffle to surface less-seen items,
  // then flatten. When ordering mode is 'latest' we reverse the final
  // sequence so newest items (which are later in the bank order) appear first.
  const flattened = sortedExposureLevels.flatMap((level) => shuffle(groups[level]));
  return orderMode === "latest" ? flattened.slice().reverse() : flattened;
};

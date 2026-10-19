const answersNotToStore = new WeakSet<object>();
const answerTtlLimits = new WeakMap<object, number>();

export const skipAnswerCache = (context: object | null | undefined) => {
  if (context) {
    answersNotToStore.add(context);
  }
};

export const isAnswerCacheSkipped = (context: object) =>
  answersNotToStore.has(context);

export const limitAnswerCache = (
  context: object | null | undefined,
  seconds: number
) => {
  if (!context || !(seconds > 0)) {
    return;
  }

  const limit = answerTtlLimits.get(context);

  if (limit === undefined || seconds < limit) {
    answerTtlLimits.set(context, seconds);
  }
};

export const answerTtlLimit = (context: object) =>
  answerTtlLimits.get(context);

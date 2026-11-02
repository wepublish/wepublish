const answersNotToStore = new WeakSet<object>();
const answerStaleAt = new WeakMap<object, number>();

export const skipAnswerCache = (context: object | null | undefined) => {
  if (context) {
    answersNotToStore.add(context);
  }
};

export const isAnswerCacheSkipped = (context: object) =>
  answersNotToStore.has(context);

export const limitAnswerCache = (
  context: object | null | undefined,
  staleAt: Date
) => {
  const time = staleAt.getTime();

  if (!context || Number.isNaN(time)) {
    return;
  }

  const limit = answerStaleAt.get(context);

  if (limit === undefined || time < limit) {
    answerStaleAt.set(context, time);
  }
};

export const answerSecondsLeft = (context: object) => {
  const staleAt = answerStaleAt.get(context);

  return staleAt === undefined ? Infinity : (
      Math.floor((staleAt - Date.now()) / 1000)
    );
};

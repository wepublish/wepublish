const answersNotToStore = new WeakSet<object>();

export const skipAnswerCache = (context: object | null | undefined) => {
  if (context) {
    answersNotToStore.add(context);
  }
};

export const isAnswerCacheSkipped = (context: object) =>
  answersNotToStore.has(context);

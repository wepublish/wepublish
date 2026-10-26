export const referralFromUrl = (href: string) => {
  try {
    return [...new URL(href).searchParams.entries()]
      .slice(0, 20)
      .map(([key, value]) => ({ key, value }));
  } catch {
    return [];
  }
};

/**
 * Mandrill merge vars are flat key/value pairs. WePublish also uses this
 * flattened shape as the common placeholder vocabulary for all mail providers.
 */
export function flattenObjForMandrill(
  value: Record<string, unknown>
): Record<string, string> {
  const flattened: Record<string, string> = {};

  const visit = (path: string, item: unknown) => {
    if (Array.isArray(item)) {
      item.forEach((nestedItem, index) => {
        visit(`${path}_${index}`, nestedItem);
      });
      return;
    }

    if (item && typeof item === 'object') {
      Object.entries(item).forEach(([key, nestedItem]) => {
        visit(path ? `${path}_${key}` : key, nestedItem);
      });
      return;
    }

    // Mailchimp's typings narrow merge var content to strings, but Mandrill
    // accepts booleans/numbers at runtime. Keep the historical runtime value.
    flattened[path] = item as string;
  };

  Object.entries(value).forEach(([key, item]) => {
    visit(key, item);
  });

  return flattened;
}

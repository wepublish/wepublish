const FIELD_OF: Record<string, string> = {
  from: 'dates',
  to: 'dates',
  publicationDateFrom: 'publicationDate',
  publicationDateTo: 'publicationDate',
};

type Filter = Record<string, unknown>;

const fieldOf = (key: string, fields: readonly string[]) => {
  const mapped = FIELD_OF[key];

  if (mapped) {
    return fields.includes(mapped) ? mapped : null;
  }

  return fields.includes(key) ? key : null;
};

const isSet = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

export const countActiveFilters = (
  fields: readonly string[],
  filter: Filter
) => {
  const active = new Set<string>();

  for (const [key, value] of Object.entries(filter)) {
    const field = fieldOf(key, fields);

    if (field && isSet(value)) {
      active.add(field);
    }
  }

  return active.size;
};

export const clearFilters = (fields: readonly string[], filter: Filter) =>
  Object.fromEntries(
    Object.entries(filter).filter(([key]) => !fieldOf(key, fields))
  );

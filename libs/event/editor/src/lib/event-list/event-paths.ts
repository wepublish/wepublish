export const eventEditPath = (id: string) => `/events/edit/${id}`;

export const eventExtendPath = (id: string) =>
  `${eventEditPath(id)}?tab=dates&focus=dateTo`;

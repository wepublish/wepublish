export const toggleRequiredLabel = (label: string, required = true) => {
  return label + (required ? '*' : '');
};

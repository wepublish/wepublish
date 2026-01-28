export const stripTypename = <T extends { __typename?: string }>({
  __typename,
  ...rest
}: T) => rest;

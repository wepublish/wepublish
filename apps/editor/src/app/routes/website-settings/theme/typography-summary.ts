import { useTranslation } from 'react-i18next';

import { fontFamilyName } from './font-family-name';
import { fontWeights } from './font-weight-select';
import { resolvedStyles } from './typography-breakpoints';

export const useTypographySummary = (
  item: Parameters<typeof resolvedStyles>[0],
  allVariants: Parameters<typeof resolvedStyles>[1],
  variant: string
) => {
  const { t } = useTranslation();
  const resolved = resolvedStyles(item, allVariants, 'xs', variant);
  const weight =
    resolved.fontWeight != null ?
      fontWeights.find(({ value }) => value === Number(resolved.fontWeight))
    : undefined;

  return [
    fontFamilyName(item?.fontFamily || allVariants?.fontFamily) || undefined,
    resolved.fontSize,
    resolved.fontWeight != null ?
      weight ? t(weight.labelKey)
      : `${resolved.fontWeight}`
    : undefined,
    resolved.lineHeight,
  ]
    .filter(Boolean)
    .join(' · ');
};

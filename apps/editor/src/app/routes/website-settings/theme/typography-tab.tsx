import { Box, useMediaQuery, useTheme } from '@mui/material';
import { memo, useEffect, useId, useRef, useState } from 'react';

import { TypeScalePreview } from './type-scale-preview';
import { TypographyVariant } from './typography-groups';
import { TypographyHeaderRefs, TypographyList } from './typography-list';

type TypographyTabProps = {
  name: string;
};

type PendingScroll = {
  variant: TypographyVariant;
  waitingFor: Set<string>;
};

export const TypographyTab = memo<TypographyTabProps>(({ name }) => {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const headerIdPrefix = useId();
  const [openTypography, setOpenTypography] = useState<TypographyVariant>();
  const [focusRequest, setFocusRequest] = useState<{
    variant: TypographyVariant;
  }>();
  const pendingScroll = useRef<PendingScroll>(undefined);
  const headerRefs: TypographyHeaderRefs = useRef({});

  const scrollTo = (variant: TypographyVariant) =>
    headerRefs.current[variant]?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

  const settle = (step: string) => {
    const pending = pendingScroll.current;

    if (!pending) {
      return;
    }

    pending.waitingFor.delete(step);

    if (!pending.waitingFor.size) {
      pendingScroll.current = undefined;
      scrollTo(pending.variant);
    }
  };

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    headerRefs.current[focusRequest.variant]?.focus({ preventScroll: true });
  }, [focusRequest]);

  const toggleTypography = (variant: TypographyVariant) => {
    pendingScroll.current = undefined;
    setOpenTypography(oldVariant =>
      oldVariant === variant ? undefined : variant
    );
  };

  const showTypography = (variant: TypographyVariant) => {
    if (openTypography === variant) {
      pendingScroll.current = undefined;
      scrollTo(variant);
    } else {
      pendingScroll.current = {
        variant,
        waitingFor: new Set([
          `opened-${variant}`,
          ...(openTypography ? [`closed-${openTypography}`] : []),
        ]),
      };
    }

    setOpenTypography(variant);
    setFocusRequest({ variant });
  };

  const list = (
    <TypographyList
      name={name}
      headerIdPrefix={headerIdPrefix}
      headerRefs={headerRefs}
      openTypography={openTypography}
      compact={isWide}
      onToggleTypography={toggleTypography}
      onOpened={variant => settle(`opened-${variant}`)}
      onClosed={variant => settle(`closed-${variant}`)}
    />
  );

  if (!isWide) {
    return <Box sx={{ maxWidth: 840 }}>{list}</Box>;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 840px) minmax(280px, 1fr)',
        gap: 4,
        alignItems: 'start',
      }}
    >
      {list}

      <Box
        sx={{
          position: 'sticky',
          top: theme.spacing(3),
          maxHeight: `calc(100vh - ${theme.spacing(6)})`,
          overflowY: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 0.75,
          p: 2,
        }}
      >
        <TypeScalePreview
          name={name}
          selected={openTypography}
          onSelect={showTypography}
        />
      </Box>
    </Box>
  );
});

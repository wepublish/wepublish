import styled from '@emotion/styled';
import { Typography, TypographyProps } from '@mui/material';
import { useId, useLayoutEffect, useRef } from 'react';

export const DrawerHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2, 3)};
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};
  flex-shrink: 0;
`;

function DialogNamingTitle({ id, ...props }: TypographyProps) {
  const generatedId = useId();
  const titleId = id ?? generatedId;
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current?.closest('[role="dialog"]');

    if (
      !dialog ||
      dialog.hasAttribute('aria-label') ||
      dialog.hasAttribute('aria-labelledby')
    ) {
      return;
    }

    dialog.setAttribute('aria-labelledby', titleId);

    return () => {
      if (dialog.getAttribute('aria-labelledby') === titleId) {
        dialog.removeAttribute('aria-labelledby');
      }
    };
  }, [titleId]);

  return (
    <Typography
      ref={ref}
      id={titleId}
      variant="h6"
      component="h2"
      {...props}
    />
  );
}

export const DrawerTitle = styled(DialogNamingTitle)`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

export const DrawerActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-shrink: 0;
`;

export const DrawerForm = styled('form')`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
`;

export const DrawerBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(2, 3)};
`;

export const DrawerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2, 3)};
  border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
  flex-shrink: 0;
`;

export const DRAWER_WIDTHS = {
  xs: 400,
  sm: 600,
  md: 800,
  lg: 968,
  full: '100vw',
} as const;

export type DrawerWidth = keyof typeof DRAWER_WIDTHS;

export const FormFields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(3)};
  align-content: start;
  width: 100%;
  min-width: 0;
`;

export const FormSectionTitle = styled((props: TypographyProps) => (
  <Typography
    variant="subtitle2"
    component="h3"
    {...props}
  />
))`
  font-weight: 600;
  margin: 0;

  &:not(:first-of-type) {
    margin-top: ${({ theme }) => theme.spacing(1.5)};
  }
`;

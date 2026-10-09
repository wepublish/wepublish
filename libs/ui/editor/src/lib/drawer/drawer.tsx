import styled from '@emotion/styled';
import { Typography, TypographyProps } from '@mui/material';

/**
 * Layout for the editor's side panels.
 *
 * MUI's `Drawer` is just a sliding surface — unlike rsuite's it has no header
 * or body parts — so these are the small styled elements MUI's own drawer
 * examples use, kept in one place rather than repeated in every panel.
 *
 * The drawer's paper is a flex column, so `DrawerBody` scrolls while the
 * header and footer stay put.
 */

export const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2, 3)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  flex-shrink: 0;
`;

/**
 * React 19 dropped `defaultProps` on function components, so the heading level
 * is set here rather than on the styled component.
 */
export const DrawerTitle = styled((props: TypographyProps) => (
  <Typography
    variant="h6"
    component="h2"
    {...props}
  />
))`
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
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  flex-shrink: 0;
`;

/** Panel widths, replacing rsuite's named `size` prop. */
export const DRAWER_WIDTHS = {
  xs: 360,
  sm: 480,
  md: 640,
  lg: 880,
  full: '100vw',
} as const;

export type DrawerWidth = keyof typeof DRAWER_WIDTHS;

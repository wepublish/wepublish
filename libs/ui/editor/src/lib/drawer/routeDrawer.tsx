import { Drawer } from '@mui/material';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { DRAWER_WIDTHS, DrawerWidth } from './drawer';

export interface RouteDrawerProps {
  closeTo: string;
  width?: DrawerWidth;
  children: ReactNode;
}

export function RouteDrawer({
  closeTo,
  width = 'sm',
  children,
}: RouteDrawerProps) {
  const navigate = useNavigate();

  return (
    <Drawer
      open
      anchor="right"
      slotProps={{
        paper: { sx: { width: DRAWER_WIDTHS[width], maxWidth: '100vw' } },
      }}
      onClose={() => navigate(closeTo)}
    >
      {children}
    </Drawer>
  );
}

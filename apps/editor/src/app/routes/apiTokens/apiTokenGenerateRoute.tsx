import { Drawer } from '@mui/material';
import { ApiTokenGeneratePanel, DRAWER_WIDTHS } from '@wepublish/ui/editor';
import { useNavigate } from 'react-router-dom';

export function ApiTokenGenerateRoute() {
  const navigate = useNavigate();
  const close = () => navigate('/api-tokens');

  return (
    <Drawer
      open
      anchor="right"
      slotProps={{
        paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
      }}
      onClose={close}
    >
      <ApiTokenGeneratePanel onClose={close} />
    </Drawer>
  );
}

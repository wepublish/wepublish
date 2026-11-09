import { AudioUploadAndEditPanel, RouteDrawer } from '@wepublish/ui/editor';
import { useNavigate } from 'react-router-dom';

export function AudioUploadRoute() {
  const navigate = useNavigate();
  const close = () => navigate('/audio');

  return (
    <RouteDrawer closeTo="/audio">
      <AudioUploadAndEditPanel
        onClose={close}
        onUpload={close}
      />
    </RouteDrawer>
  );
}

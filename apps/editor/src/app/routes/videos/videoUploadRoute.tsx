import { VideoUploadAndEditPanel, RouteDrawer } from '@wepublish/ui/editor';
import { useNavigate } from 'react-router-dom';

export function VideoUploadRoute() {
  const navigate = useNavigate();
  const close = () => navigate('/videos');

  return (
    <RouteDrawer closeTo="/videos">
      <VideoUploadAndEditPanel
        onClose={close}
        onUpload={close}
      />
    </RouteDrawer>
  );
}

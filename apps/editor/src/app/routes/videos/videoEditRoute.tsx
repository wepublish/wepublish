import { VideoEditPanel, RouteDrawer } from '@wepublish/ui/editor';
import { useNavigate, useParams } from 'react-router-dom';

export function VideoEditRoute() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <RouteDrawer closeTo="/videos">
      <VideoEditPanel
        id={id}
        onClose={() => navigate('/videos')}
      />
    </RouteDrawer>
  );
}

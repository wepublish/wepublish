import { AudioEditPanel, RouteDrawer } from '@wepublish/ui/editor';
import { useNavigate, useParams } from 'react-router-dom';

export function AudioEditRoute() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <RouteDrawer closeTo="/audio">
      <AudioEditPanel
        id={id}
        onClose={() => navigate('/audio')}
      />
    </RouteDrawer>
  );
}

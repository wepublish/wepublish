import { useQuery } from '@apollo/client/react';
import { Alert, List, ListItem, ListItemText, Stack } from '@mui/material';
import { EditorPlaceListDocument } from '@wepublish/editor/api';
import { CanUpdateOrganization } from '@wepublish/permissions';
import { Link, useAuthorisation } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { FormSection } from '../form-layout';
import { venueCreatePath, venueEditPath } from '../venue/venue-paths';

export function OrganizationVenues({
  organizationId,
}: {
  organizationId: string;
}) {
  const { t } = useTranslation();
  const mayCreate = useAuthorisation(CanUpdateOrganization.id) === true;

  const { data } = useQuery(EditorPlaceListDocument, {
    variables: { filter: { organizationId }, take: 50 },
  });

  if (!data) {
    return null;
  }

  const places = data.places.nodes;

  return (
    <FormSection title={t('agenda.organizations.venues.title')}>
      {places.length === 0 ?
        <Alert severity="info">{t('agenda.organizations.venues.none')}</Alert>
      : <List
          dense
          disablePadding
        >
          {places.map(place => (
            <ListItem
              key={place.id}
              disableGutters
            >
              <ListItemText
                primary={<Link to={venueEditPath(place.id)}>{place.name}</Link>}
                secondary={[place.address, `${place.zip} ${place.city}`]
                  .filter(Boolean)
                  .join(', ')}
              />
            </ListItem>
          ))}
        </List>
      }

      {mayCreate && (
        <Stack direction="row">
          <Link to={venueCreatePath(organizationId)}>
            {t('agenda.organizations.venues.create')}
          </Link>
        </Stack>
      )}
    </FormSection>
  );
}

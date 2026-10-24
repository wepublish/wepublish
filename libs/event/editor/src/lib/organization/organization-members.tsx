import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddOrganizationMemberDocument,
  EditorOrganizationMembersDocument,
  RemoveOrganizationMemberDocument,
  UserListDocument,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdPersonRemove } from 'react-icons/md';

import { userDisplayName } from '../facts/event-owner-field';
import { FormSection } from '../form-layout';
import { showError } from '../show-error';

type UserOption = { id: string; name: string; email?: string | null };

function MemberPicker({
  memberIds,
  disabled,
  onPick,
}: {
  memberIds: string[];
  disabled: boolean;
  onPick(user: UserOption): void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data, loading } = useQuery(UserListDocument, {
    variables: { filter: { text: search || undefined }, take: 10 },
    skip: !open,
  });

  const options: UserOption[] = (data?.users.nodes ?? [])
    .filter(user => !memberIds.includes(user.id))
    .map(user => ({
      id: user.id,
      name: userDisplayName(user),
      email: user.email,
    }));

  return (
    <Autocomplete<UserOption>
      options={options}
      value={null}
      loading={loading}
      disabled={disabled}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        setSearch('');
      }}
      onChange={(_event, user) => user && onPick(user)}
      onInputChange={(_event, input, reason) =>
        setSearch(reason === 'input' ? input : '')
      }
      filterOptions={all => all}
      getOptionLabel={user =>
        user.email ? `${user.name} (${user.email})` : user.name
      }
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      renderInput={params => (
        <TextField
          {...params}
          label={t('agenda.organizations.members.add')}
          helperText={t('agenda.organizations.members.addHelp')}
        />
      )}
    />
  );
}

export function OrganizationMembers({
  organizationId,
}: {
  organizationId: string;
}) {
  const { t, i18n } = useTranslation();

  const { data, refetch } = useQuery(EditorOrganizationMembersDocument, {
    variables: { id: organizationId },
  });
  const [addMember, { loading: adding }] = useMutation(
    AddOrganizationMemberDocument
  );
  const [removeMember, { loading: removing }] = useMutation(
    RemoveOrganizationMemberDocument
  );

  const organization = data?.organization;

  if (organization?.__typename !== 'SensitiveDataOrganization') {
    return null;
  }

  const { members } = organization;
  const mayManage = organization.viewerCan.manageMembers;

  const change = async (
    mutate: typeof addMember | typeof removeMember,
    userId: string
  ) => {
    try {
      await mutate({ variables: { organizationId, userId } });
      await refetch();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <FormSection title={t('agenda.organizations.members.title')}>
      {members.length === 0 ?
        <Alert severity="warning">
          <AlertTitle>{t('agenda.organizations.members.noneTitle')}</AlertTitle>
          {t('agenda.organizations.members.noneBody')}
        </Alert>
      : <List
          dense
          disablePadding
        >
          {members.map(member => {
            const name =
              member.user ? userDisplayName(member.user) : member.userId;

            return (
              <ListItem
                key={member.userId}
                disableGutters
                secondaryAction={
                  mayManage && (
                    <IconButton
                      edge="end"
                      aria-label={t('agenda.organizations.members.remove', {
                        name,
                      })}
                      disabled={removing}
                      onClick={() => change(removeMember, member.userId)}
                    >
                      <MdPersonRemove />
                    </IconButton>
                  )
                }
              >
                <ListItemText
                  primary={name}
                  secondary={t('agenda.organizations.members.since', {
                    date: new Date(member.createdAt).toLocaleDateString(
                      i18n.language
                    ),
                  })}
                />
              </ListItem>
            );
          })}
        </List>
      }

      {mayManage ?
        <MemberPicker
          memberIds={members.map(({ userId }) => userId)}
          disabled={adding}
          onPick={user => change(addMember, user.id)}
        />
      : <Typography
          variant="body2"
          color="text.secondary"
        >
          {t('agenda.organizations.members.manageLocked')}
        </Typography>
      }
    </FormSection>
  );
}

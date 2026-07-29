import styled from '@emotion/styled';
import { usePresence } from './use-presence';
import { Avatar, Chip } from '@mui/material';
import { memo } from 'react';

const PresentUsersWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: 4px;
`;

export const PresentUsers = memo<{ id: string }>(({ id }) => {
  const [users] = usePresence(id);

  if (!users.size) {
    return;
  }

  return (
    <PresentUsersWrapper>
      {Array.from(users.values()).map(user => (
        <Chip
          key={user.id}
          size="small"
          avatar={
            <Avatar>
              {user.name
                .split(' ')
                .map(str => str.at(0) ?? '')
                .join('')}
            </Avatar>
          }
          label={user.name}
        />
      ))}
    </PresentUsersWrapper>
  );
});

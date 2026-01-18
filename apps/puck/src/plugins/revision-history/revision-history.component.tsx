import { useMemo, useState } from 'react';
import { Box, ListItemButton, Typography, Stack, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { formatDistanceToNow, format, isFuture } from 'date-fns';
import nanoid from 'nanoid';
import { faker } from '@faker-js/faker';
import { IconButton } from '@wepublish/ui';
import { MdRestartAlt } from 'react-icons/md';

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5),
  padding: theme.spacing(1),
  border: `1px solid transparent`,
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main + '14',
    borderColor: `${theme.palette.primary.main}40`,
    '&:hover': {
      backgroundColor: theme.palette.primary.main + '20',
    },
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '.MuiListItemText-root': {
    margin: 0,
  },
}));

const Badge = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.25, 1),
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.7rem',
  fontWeight: 600,
}));

const SavedBadge = styled(Badge)(
  ({ theme }) => `
  background-color: ${theme.palette.info.main + '20'};
  color: ${theme.palette.info.dark};
`
);

const PublishedBadge = styled(Badge)(
  ({ theme }) => `
  background-color: ${theme.palette.success.main + '20'};
  color: ${theme.palette.success.dark};
`
);

const revisions = Array.from(new Array(10), (any, i) => ({
  id: nanoid(),
  publishedAt:
    i === 0 && Math.random() > 0.9 ? faker.date.future()
    : Math.random() > 0.7 ? faker.date.recent()
    : null,
  createdAt: faker.date.recent(),
  title: faker.commerce.productName(),
  user: {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
  },
}));

export function RevisionHistory() {
  const currentRevision = useMemo(
    () =>
      revisions.find(
        revision => revision.publishedAt && new Date() > revision.publishedAt
      ),
    [revisions]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (revision: (typeof revisions)[0]) => {
    setSelectedId(revision.id);
  };

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h5"
          component={'div'}
          fontWeight={600}
        >
          Revision History
        </Typography>

        <Typography
          variant="body2"
          component={'div'}
          color="text.secondary"
        >
          {revisions.length} revisions available
        </Typography>
      </Box>

      <Divider />

      {revisions.map((revision, index) => {
        const isCurrentPublished = currentRevision?.id === revision.id;
        const isSelected = selectedId === revision.id;

        return (
          <StyledListItemButton
            key={revision.id}
            selected={isSelected}
            onClick={() => handleSelect(revision)}
          >
            <div>
              <Stack spacing={0.5}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  flexWrap="wrap"
                >
                  {isCurrentPublished && <SavedBadge>Current</SavedBadge>}

                  {revision.publishedAt &&
                    revision.publishedAt > new Date() && (
                      <Badge
                        sx={theme => ({
                          backgroundColor: theme.palette.warning.main + '20',
                          color: 'warning.dark',
                        })}
                      >
                        Pending
                      </Badge>
                    )}

                  {revision.publishedAt &&
                    new Date() > revision.publishedAt && (
                      <PublishedBadge>Published</PublishedBadge>
                    )}
                </Stack>

                <Typography
                  variant="subtitle2"
                  component={'div'}
                  fontWeight={600}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}
                >
                  {formatDistanceToNow(new Date(revision.createdAt), {
                    addSuffix: true,
                  })}
                </Typography>

                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  {format(new Date(revision.createdAt), 'MMM d, yyyy h:mm a')}{' '}
                  &ndash; by {revision.user.firstName} {revision.user.lastName}
                </Typography>

                {revision.publishedAt && (
                  <Typography
                    variant="subtitle2"
                    color={
                      isFuture(new Date(revision.publishedAt)) ? 'warning.main'
                      : 'success.main'
                    }
                  >
                    {isFuture(new Date(revision.publishedAt)) ?
                      `Scheduled for ${format(new Date(revision.publishedAt), 'MMM d, yyyy h:mm a')}`
                    : `Published ${format(new Date(revision.publishedAt), 'MMM d, yyyy h:mm a')}`
                    }
                  </Typography>
                )}
              </Stack>

              {!!index && (
                <IconButton
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  size="small"
                  color="primary"
                  sx={theme => ({
                    ml: 1,
                    position: 'absolute',
                    top: theme.spacing(1),
                    right: theme.spacing(1),
                    opacity: 0,
                    visibility: 'hidden',
                    transition: 'opacity 0.2s',
                    '.MuiListItemButton-root:hover &': {
                      opacity: 1,
                      visibility: 'visible',
                    },
                  })}
                >
                  <MdRestartAlt size={16} />
                </IconButton>
              )}
            </div>
          </StyledListItemButton>
        );
      })}
    </>
  );
}

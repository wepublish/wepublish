import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, Drawer, Typography } from '@mui/material';
import { PollDocument } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOpenInNew } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { BlockPreviewCard } from '../atoms/blockPreviewCard';
import {
  CopyPollAnswerVoteUrlButton,
  usePollAnswerVoteUrl,
} from '../atoms/poll/pollAnswerVoteUrl';
import { DRAWER_WIDTHS } from '../drawer';
import { SelectPollPanel } from '../panel/selectPollPanel';
import { PollBlockValue } from '.';

const Answers = styled('ul')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Answer = styled('li')`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

export const PollBlock = ({
  value: { poll },
  onChange,
  autofocus,
  disabled,
}: BlockProps<PollBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(
    () => Boolean(autofocus) && !poll
  );
  const { t } = useTranslation();
  const buildVoteUrl = usePollAnswerVoteUrl();

  const { data } = useQuery(PollDocument, {
    variables: { id: poll?.id as string },
    skip: !poll?.id,
  });

  const answers = data?.poll?.answers ?? [];

  return (
    <>
      <BlockPreviewCard
        isEmpty={!poll}
        emptyLabel={t('blocks.poll.choosePoll')}
        editLabel={t('blocks.poll.edit')}
        onEdit={() => setIsDialogOpen(true)}
        title={poll?.question}
        disabled={disabled}
        actions={
          poll && (
            <Button
              size="small"
              href={`/polls/edit/${poll.id}`}
              target="_blank"
              endIcon={<MdOpenInNew />}
              sx={{ mr: 1 }}
            >
              {t('blocks.poll.open')}
            </Button>
          )
        }
      >
        {!!answers.length && (
          <Answers>
            {answers.map(answer => (
              <Answer key={answer.id}>
                <CopyPollAnswerVoteUrlButton
                  voteUrl={buildVoteUrl(answer.id)}
                />

                <Typography variant="body2">{answer.answer}</Typography>
              </Answer>
            ))}
          </Answers>
        )}
      </BlockPreviewCard>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.lg,
              maxWidth: '100vw',
            },
          },
        }}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <SelectPollPanel
          selectedPoll={poll}
          onClose={() => setIsDialogOpen(false)}
          onSelect={onNewPoll => {
            setIsDialogOpen(false);
            onChange({ poll: onNewPoll });
          }}
        />
      </Drawer>
    </>
  );
};

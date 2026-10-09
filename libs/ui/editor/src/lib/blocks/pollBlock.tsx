import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, Card as MuiCard, CardContent, Drawer } from '@mui/material';
import { PollDocument } from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import {
  CopyPollAnswerVoteUrlButton,
  usePollAnswerVoteUrl,
} from '../atoms/poll/pollAnswerVoteUrl';
import { DRAWER_WIDTHS } from '../drawer';
import { SelectPollPanel } from '../panel/selectPollPanel';
import { PollBlockValue } from '.';

const IconWrapper = styled.div`
  position: absolute;
  z-index: 100;
  height: 100%;
  right: 0;
`;

const Poll = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Content = styled.div`
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 12px;
  height: 100%;
  padding: 24px 24px 32px;
`;

const Question = styled.div`
  font-weight: bold;
  text-align: center;
`;

const Answers = styled.div`
  display: grid;
  gap: 4px;
  justify-items: center;
`;

const Answer = styled.div`
  align-items: center;
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  gap: 8px;
`;

const Panel = styled(MuiCard)`
  display: grid;
  min-height: 200px;
  padding: 0;
  background-color: var(--rs-bg-well);
`;

export const PollBlock = ({
  value: { poll },
  onChange,
  autofocus,
}: BlockProps<PollBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();
  const buildVoteUrl = usePollAnswerVoteUrl();

  const { data } = useQuery(PollDocument, {
    variables: { id: poll?.id as string },
    skip: !poll?.id,
  });

  const answers = data?.poll?.answers ?? [];

  useEffect(() => {
    if (autofocus && !poll) {
      setIsDialogOpen(true);
    }
  }, []);

  return (
    <>
      <Panel>
        <CardContent>
          <CardContent>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <PlaceholderInput
                onAddClick={() => setIsDialogOpen(true)}
                addLabel={t('blocks.poll.choosePoll')}
              >
                {poll && (
                  <Poll>
                    <IconWrapper>
                      <Button
                        variant="outlined"
                        startIcon={<MdEdit />}
                        size="large"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        {t('blocks.poll.edit')}
                      </Button>
                    </IconWrapper>

                    <Content>
                      <Question>{poll.question}</Question>

                      <Answers>
                        {answers.map(answer => (
                          <Answer key={answer.id}>
                            <span>{answer.answer}</span>

                            <CopyPollAnswerVoteUrlButton
                              voteUrl={buildVoteUrl(answer.id)}
                            />
                          </Answer>
                        ))}
                      </Answers>
                    </Content>
                  </Poll>
                )}
              </PlaceholderInput>
            </CardContent>
          </CardContent>
        </CardContent>
      </Panel>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
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

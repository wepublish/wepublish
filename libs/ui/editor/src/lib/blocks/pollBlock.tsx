import styled from '@emotion/styled';
import { usePollQuery } from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Drawer, IconButton, Panel as RPanel } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import {
  CopyPollAnswerVoteUrlButton,
  usePollAnswerVoteUrl,
} from '../atoms/poll/pollAnswerVoteUrl';
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

const Panel = styled(RPanel)`
  display: grid;
  min-height: 200px;
  padding: 0;
  background-color: #f7f9fa;
`;

export const PollBlock = ({
  value: { poll },
  onChange,
  autofocus,
}: BlockProps<PollBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();
  const buildVoteUrl = usePollAnswerVoteUrl();

  const { data } = usePollQuery({
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
      <Panel
        bodyFill
        bordered
      >
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {poll && (
            <Poll>
              <IconWrapper>
                <IconButton
                  size="lg"
                  icon={<MdEdit />}
                  onClick={() => setIsDialogOpen(true)}
                >
                  {t('blocks.poll.edit')}
                </IconButton>
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
      </Panel>

      <Drawer
        size="lg"
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

import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Drawer, IconButton, Panel as RPanel } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
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
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled(RPanel)`
  display: grid;
  height: 200px;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
`;

export const PollBlock = ({
  value: { poll },
  onChange,
  autofocus,
}: BlockProps<PollBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();

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

              {poll.question}
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

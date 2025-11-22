import { TableCell } from '@mui/material';
import styled from '@emotion/styled';
import { PermissionControl } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { Button, IconButton, InputNumber, Popover, Whisper } from 'rsuite';

const PopoverBody = styled('div')`
  display: grid;
  min-width: 170px;
  justify-content: center;
  flex-wrap: wrap;
`;

const FlexContainer = styled('div')`
  display: flex;
`;

interface EventsHeadProps {
  setNewDay(newDay: number): void;
}

export function EventsHead({ setNewDay }: EventsHeadProps) {
  const { t } = useTranslation();
  const [createDayFrom, setCreateDayFrom] = useState<number>(-3);

  return (
    <PermissionControl qualifyingPermissions={['CAN_UPDATE_SUBSCRIPTION_FLOW']}>
      <TableCell align="center">
        <Whisper
          placement="leftEnd"
          trigger="click"
          speaker={
            <Popover>
              <PopoverBody>
                <h6>New day in timeline</h6>

                <FlexContainer style={{ marginTop: '5px' }}>
                  <InputNumber
                    defaultValue={createDayFrom}
                    onChange={value => setCreateDayFrom(+value)}
                    step={1}
                  />

                  <Button
                    onClick={() => setNewDay(+createDayFrom)}
                    appearance="primary"
                    style={{ marginLeft: '5px' }}
                  >
                    {t('subscriptionFlow.add')}
                  </Button>
                </FlexContainer>
              </PopoverBody>
            </Popover>
          }
        >
          <IconButton
            icon={<MdAdd />}
            color="green"
            appearance="primary"
            circle
          />
        </Whisper>
      </TableCell>
    </PermissionControl>
  );
}

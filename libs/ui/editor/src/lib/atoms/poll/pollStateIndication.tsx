import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import {
  MdHourglassEmpty,
  MdPlayCircleOutline,
  MdPowerOff,
} from 'react-icons/md';
import { Tooltip, Whisper } from 'rsuite';

const ClosedIcon = styled(MdPowerOff)`
  color: red;
`;

const OpensIcon = styled(MdPlayCircleOutline)`
  color: green;
`;

interface PollStateIndicationProps {
  closedAt: string | null | undefined;
  opensAt: string;
}

export function PollStateIndication({
  closedAt: pollClosedAt,
  opensAt: pollOpensAt,
}: PollStateIndicationProps) {
  const { t } = useTranslation();
  const now = new Date();
  const closedAt = pollClosedAt ? new Date(pollClosedAt) : undefined;

  // poll has been closed
  if (closedAt && now.getTime() >= closedAt.getTime()) {
    return (
      <Whisper speaker={<Tooltip>{t('pollStateIndication.closed')}</Tooltip>}>
        <span>
          <ClosedIcon />
        </span>
      </Whisper>
    );
  }

  // poll is open
  const opensAt = new Date(pollOpensAt);
  if (now.getTime() > opensAt.getTime()) {
    return (
      <Whisper speaker={<Tooltip>{t('pollStateIndication.open')}</Tooltip>}>
        <span>
          <OpensIcon />
        </span>
      </Whisper>
    );
  }

  // poll is waiting to be opened
  return (
    <Whisper
      speaker={
        <Tooltip>
          {t('pollStateIndication.waiting', { date: new Date(pollOpensAt) })}
        </Tooltip>
      }
    >
      <span>
        <MdHourglassEmpty />
      </span>
    </Whisper>
  );
}

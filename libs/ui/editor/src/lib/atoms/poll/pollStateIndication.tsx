import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import {
  MdHourglassEmpty,
  MdPlayCircleOutline,
  MdPowerOff,
} from 'react-icons/md';
import { Tooltip } from 'rsuite';

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
      <Tooltip title={t('pollStateIndication.closed')}>
        <span
          role="img"
          aria-label={t('pollStateIndication.closed')}
        >
          <ClosedIcon />
        </span>
      </Tooltip>
    );
  }

  // poll is open
  const opensAt = new Date(pollOpensAt);
  if (now.getTime() > opensAt.getTime()) {
    return (
      <Tooltip title={t('pollStateIndication.open')}>
        <span
          role="img"
          aria-label={t('pollStateIndication.open')}
        >
          <OpensIcon />
        </span>
      </Tooltip>
    );
  }

  // poll is waiting to be opened
  return (
    <Tooltip
      title={t('pollStateIndication.waiting', { date: new Date(pollOpensAt) })}
    >
      <span
        role="img"
        aria-label={t('pollStateIndication.waiting', {
          date: new Date(pollOpensAt),
        })}
      >
        <MdHourglassEmpty />
      </span>
    </Tooltip>
  );
}

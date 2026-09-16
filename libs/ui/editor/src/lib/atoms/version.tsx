import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import {
  OneChannelConnectionState,
  useOneChannelStatusQuery,
  useVersionInformationQuery,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

const StyledVersion = styled.div`
  padding: 5px 5px 5px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
`;

const StatusDot = styled.span<{ dotColor: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ dotColor }) => dotColor};
`;

const VersionLabel = styled.div`
  min-width: 0;
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DOT_COLORS: Record<OneChannelConnectionState, string> = {
  [OneChannelConnectionState.Connected]: '#2e7d32',
  [OneChannelConnectionState.Failing]: '#ed6c02',
  [OneChannelConnectionState.NotConfigured]: '#d32f2f',
};

export function Version() {
  const { t } = useTranslation();
  const { data: versionData } = useVersionInformationQuery();
  const { data: channelData } = useOneChannelStatusQuery();

  const version = versionData?.versionInformation?.version ?? '';
  const status = channelData?.oneChannelStatus;

  const formatDate = (value?: string | null) => {
    if (!value) {
      return null;
    }

    return new Date(value).toLocaleString('de-CH');
  };

  const buildTooltip = () => {
    if (!status) {
      return '';
    }

    const lastSuccess = formatDate(status.lastSuccessAt);
    const lines: string[] = [];

    if (status.state === OneChannelConnectionState.NotConfigured) {
      lines.push(t('oneChannel.notConfigured'));
      lines.push(t('oneChannel.notConfiguredHint'));
      lines.push(t('oneChannel.lastSuccessNever'));

      return lines.join('\n');
    }

    lines.push(
      status.state === OneChannelConnectionState.Connected ?
        t('oneChannel.connected')
      : t('oneChannel.failing')
    );

    lines.push(
      lastSuccess ?
        t('oneChannel.lastSuccess', { value: lastSuccess })
      : t('oneChannel.lastSuccessNever')
    );

    if (status.state === OneChannelConnectionState.Failing) {
      lines.push(
        t('oneChannel.lastAttemptFailed', {
          value: formatDate(status.lastAttemptAt) ?? '-',
          error: status.lastError ?? '-',
        })
      );
    }

    if (status.oneUrl) {
      lines.push(status.oneUrl);
    }

    return lines.join('\n');
  };

  const tooltip = buildTooltip();

  return (
    <StyledVersion>
      {status && (
        <Tooltip
          title={<span style={{ whiteSpace: 'pre-line' }}>{tooltip}</span>}
        >
          <StatusDot
            dotColor={DOT_COLORS[status.state]}
            role="img"
            aria-label={tooltip}
          />
        </Tooltip>
      )}
      <VersionLabel title={version}>{version}</VersionLabel>
    </StyledVersion>
  );
}

export default Version;

import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import {
  OneChannelConnectionState,
  useOneChannelStatusQuery,
  useVersionInformationQuery,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

const StyledVersion = styled.div`
  /* Sits below the footer's icon buttons; the dot lines up with the column
     their icons occupy, so the row reads as part of the same rail. */
  padding: 4px 8px 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  cursor: default;
  /* Sits outside the Sidenav/Navbar elements that paint the rail, so it carries
     their background itself — otherwise the grey stops above this row. */
  background-color: var(--rs-navbar-default-bg, #f7f7fa);
`;

const StatusDot = styled.span<{ dotColor: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ dotColor }) => dotColor};
`;

const ConnectorLabel = styled.div`
  min-width: 0;
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * What the API answers when no `.version` file was deployed — a dev build, or a
 * container built without the stamp. It is not a version, so it is not shown.
 */
const UNKNOWN_VERSION = '<!- VERSION UNKNOWN -!>';

const DOT_COLORS: Record<OneChannelConnectionState, string> = {
  [OneChannelConnectionState.Connected]: '#2e7d32',
  [OneChannelConnectionState.Failing]: '#ed6c02',
  [OneChannelConnectionState.NotConfigured]: '#d32f2f',
};

export function Version() {
  const { t } = useTranslation();
  const { data: versionData } = useVersionInformationQuery();
  const { data: channelData } = useOneChannelStatusQuery();

  // The API returns the whole label ("Deployed Version: 890550c"), so it is
  // shown as-is rather than wrapped in another one.
  const rawVersion = versionData?.versionInformation?.version ?? '';
  const version = rawVersion === UNKNOWN_VERSION ? '' : rawVersion;
  const status = channelData?.oneChannelStatus;

  const formatDate = (value?: string | null) => {
    if (!value) {
      return null;
    }

    return new Date(value).toLocaleString('de-CH');
  };

  // The deployed version lives in here rather than on the sidebar: it is
  // looked up rarely, while the connector state is meant to be glanceable.
  const buildTooltip = () => {
    const lines: string[] = [];
    const withVersion = () => {
      if (version) {
        lines.push(version);
      }

      return lines.join('\n');
    };

    if (!status) {
      return withVersion();
    }

    const lastSuccess = formatDate(status.lastSuccessAt);

    if (status.state === OneChannelConnectionState.NotConfigured) {
      lines.push(t('oneChannel.notConfigured'));
      lines.push(t('oneChannel.notConfiguredHint'));
      lines.push(t('oneChannel.lastSuccessNever'));

      return withVersion();
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

    return withVersion();
  };

  const tooltip = buildTooltip();

  return (
    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{tooltip}</span>}>
      <StyledVersion aria-label={tooltip}>
        <StatusDot
          dotColor={
            status ?
              DOT_COLORS[status.state]
            : DOT_COLORS[OneChannelConnectionState.NotConfigured]
          }
          role="img"
        />
        <ConnectorLabel>{t('oneChannel.label')}</ConnectorLabel>
      </StyledVersion>
    </Tooltip>
  );
}

export default Version;

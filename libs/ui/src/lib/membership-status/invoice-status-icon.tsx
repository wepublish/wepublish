import styled from '@emotion/styled';
import { Theme, Tooltip } from '@mui/material';
import { ReactNode } from 'react';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import { MdAccessTime, MdClose, MdDone } from 'react-icons/md';

import { InvoiceState } from './invoice-state';

// The editor's theme has CSS variables, the websites' does not.
const palette = (theme: Theme) => (theme.vars ?? theme).palette;

const statusColors: Record<InvoiceState, (theme: Theme) => string> = {
  paid: theme => palette(theme).success.main,
  canceled: theme => palette(theme).error.main,
  unpaid: theme => palette(theme).warning.main,
};

const statusIcons: Record<InvoiceState, ReactNode> = {
  paid: <MdDone />,
  canceled: <MdClose />,
  unpaid: <MdAccessTime />,
};

const InvoiceIconWrapper = styled('span')`
  position: relative;
  display: inline-flex;
  vertical-align: middle;
`;

const InvoiceIcon = styled(LiaFileInvoiceSolid)`
  color: ${({ theme }) => palette(theme).text.secondary};
  font-size: 26px;
`;

const StatusPill = styled('span')<{ status: InvoiceState }>`
  position: absolute;
  right: -5px;
  top: 55%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${({ theme, status }) => statusColors[status](theme)};
  color: ${({ theme }) => palette(theme).common.white};
  font-size: 10px;
  box-shadow: 0 0 0 2px ${({ theme }) => palette(theme).background.paper};
`;

export interface InvoiceStatusIconProps {
  status: InvoiceState;
  title: string;
}

export function InvoiceStatusIcon({ status, title }: InvoiceStatusIconProps) {
  return (
    <Tooltip
      title={title}
      placement="top"
    >
      <InvoiceIconWrapper>
        <InvoiceIcon />

        <StatusPill status={status}>{statusIcons[status]}</StatusPill>
      </InvoiceIconWrapper>
    </Tooltip>
  );
}

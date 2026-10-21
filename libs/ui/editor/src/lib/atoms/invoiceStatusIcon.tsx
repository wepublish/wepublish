import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import { ReactNode } from 'react';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import { MdAccessTime, MdClose, MdDone } from 'react-icons/md';

import { paletteColor } from '../paletteColor';

export type InvoiceStatus = 'paid' | 'canceled' | 'unpaid';

const statusColors: Record<InvoiceStatus, string> = {
  paid: 'success.main',
  canceled: 'error.main',
  unpaid: 'warning.main',
};

const statusIcons: Record<InvoiceStatus, ReactNode> = {
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
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 26px;
`;

const StatusPill = styled('span')<{ pillColor: string }>`
  position: absolute;
  right: -5px;
  top: 55%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${({ theme, pillColor }) => paletteColor(theme, pillColor)};
  color: ${({ theme }) => theme.vars.palette.common.white};
  font-size: 10px;
  box-shadow: 0 0 0 2px ${({ theme }) => theme.vars.palette.background.paper};
`;

export interface InvoiceStatusIconProps {
  status: InvoiceStatus;
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

        <StatusPill pillColor={statusColors[status]}>
          {statusIcons[status]}
        </StatusPill>
      </InvoiceIconWrapper>
    </Tooltip>
  );
}

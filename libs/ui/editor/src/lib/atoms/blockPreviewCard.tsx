import styled from '@emotion/styled';
import { Button, ButtonBase, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { MdAddCircleOutline, MdEdit } from 'react-icons/md';

const Empty = styled(ButtonBase)`
  display: grid;
  place-content: center;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  min-height: 160px;
  padding: ${({ theme }) => theme.spacing(3)};
  border: 1px dashed ${({ theme }) => theme.vars.palette.action.disabled};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  transition: ${({ theme }) =>
    theme.transitions.create(['border-color', 'background-color', 'color'])};

  &:hover,
  &.Mui-focusVisible {
    border-color: ${({ theme }) => theme.vars.palette.primary.main};
    color: ${({ theme }) => theme.vars.palette.primary.main};
    background-color: rgba(
      ${({ theme }) => theme.vars.palette.primary.mainChannel} / 0.08
    );
  }

  &.Mui-disabled {
    opacity: 0.5;
  }

  svg {
    font-size: 28px;
  }
`;

const Card = styled('div')`
  display: grid;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  overflow: hidden;
`;

const Header = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1, 2)};
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(1.5, 2)};
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};

  &:last-child {
    border-bottom: 0;
  }
`;

const HeaderText = styled('div')`
  display: grid;
  min-width: 0;
`;

const Body = styled('div')`
  padding: ${({ theme }) => theme.spacing(2)};
  min-width: 0;
`;

export type BlockPreviewCardProps = {
  isEmpty: boolean;
  emptyLabel: string;
  editLabel: string;
  onEdit: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
};

export function BlockPreviewCard({
  isEmpty,
  emptyLabel,
  editLabel,
  onEdit,
  title,
  subtitle,
  actions,
  disabled,
  children,
}: BlockPreviewCardProps) {
  if (isEmpty) {
    return (
      <Empty
        disabled={disabled}
        onClick={onEdit}
      >
        <MdAddCircleOutline aria-hidden />
        <Typography variant="body2">{emptyLabel}</Typography>
      </Empty>
    );
  }

  return (
    <Card>
      <Header>
        <HeaderText>
          {title && (
            <Typography
              variant="subtitle2"
              component="p"
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {subtitle}
            </Typography>
          )}
        </HeaderText>

        <div>
          {actions}
          <Button
            variant="outlined"
            size="small"
            startIcon={<MdEdit />}
            disabled={disabled}
            onClick={onEdit}
          >
            {editLabel}
          </Button>
        </div>
      </Header>

      {children && <Body>{children}</Body>}
    </Card>
  );
}

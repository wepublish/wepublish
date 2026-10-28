import styled from '@emotion/styled';
import {
  Button,
  ButtonProps,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import { ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMoreVert } from 'react-icons/md';

import { paletteColor } from '../paletteColor';
import { StateColor } from '../utility';
import { StatePill, stateTextColors } from './statePill';

const Bar = styled('header', {
  shouldForwardProp: prop => prop !== 'accent',
})<{ accent: string }>`
  container-type: inline-size;
  width: 100%;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};
  box-shadow: inset 0 3px 0 ${({ accent }) => accent};

  @container (max-width: 1240px) {
    button[data-collapse='md'] {
      min-width: 0;
      padding-inline: 9px;

      [data-label] {
        display: none;
      }

      .MuiButton-startIcon {
        margin: 0;
      }
    }
  }

  [data-overflow-toggle] {
    display: none;
  }

  @container (max-width: 520px) {
    [data-overflow-item] {
      display: none;
    }

    [data-overflow-toggle] {
      display: inline-flex;
    }

    button[data-collapse='sm'] {
      min-width: 0;
      padding-inline: 9px;

      [data-label] {
        display: none;
      }

      .MuiButton-startIcon {
        margin: 0;
      }
    }
  }
`;

const Inner = styled('div')`
  display: flex;
  align-items: center;
  gap: 12px 16px;
  min-height: 64px;
  padding: 13px 20px 10px;

  @container (max-width: 760px) {
    flex-wrap: wrap;
    padding: 11px 12px 8px;
  }
`;

const Start = styled('div')`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const Status = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, auto);
  justify-items: start;
  gap: 2px;
  min-width: 0;
`;

const Meta = styled('span')`
  max-width: 100%;
  overflow: hidden;
  padding-left: 2px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const StatusAction = styled('div')`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  margin-left: auto;
`;

const Title = styled('div')`
  flex: 1 1 auto;
  min-width: 0;
`;

const Actions = styled('div')`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;

  @container (max-width: 760px) {
    flex: 1 1 100%;
    justify-content: space-between;
  }
`;

const Group = styled('div')`
  display: flex;
  align-items: center;
  gap: 4px;

  &:empty {
    display: none;
  }
`;

const PrimaryGroup = styled(Group)`
  gap: 8px;
`;

const Divider = styled('span')`
  flex-shrink: 0;
  width: 1px;
  height: 24px;
  margin: 0 4px;
  background-color: ${({ theme }) => theme.vars.palette.divider};
`;

export interface EditorHeaderMenuAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface EditorHeaderProps {
  state: StateColor;
  stateLabel: string;
  meta?: ReactNode;
  back?: ReactNode;
  statusAction?: ReactNode;
  title?: ReactNode;
  menuActions?: EditorHeaderMenuAction[];
  secondaryActions?: ReactNode;
  primaryActions?: ReactNode;
}

function EditorHeaderMenu({ actions }: { actions: EditorHeaderMenuAction[] }) {
  const { t } = useTranslation();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!actions.length) {
    return null;
  }

  return (
    <>
      {actions.map(action => (
        <EditorHeaderButton
          key={action.label}
          data-overflow-item
          variant="text"
          icon={action.icon}
          label={action.label}
          disabled={action.disabled}
          onClick={action.onClick}
        />
      ))}

      <IconButton
        data-overflow-toggle
        color="primary"
        aria-label={t('editorHeader.moreActions')}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={anchor ? 'true' : undefined}
        onClick={event => setAnchor(event.currentTarget)}
      >
        <MdMoreVert />
      </IconButton>

      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
      >
        {actions.map(action => (
          <MenuItem
            key={action.label}
            disabled={action.disabled}
            onClick={() => {
              setAnchor(null);
              action.onClick();
            }}
          >
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export function EditorHeader({
  state,
  stateLabel,
  meta,
  back,
  statusAction,
  title,
  menuActions = [],
  secondaryActions,
  primaryActions,
}: EditorHeaderProps) {
  const statusId = useId();
  const theme = useTheme();
  const textColor = paletteColor(theme, stateTextColors[state]);

  return (
    <Bar accent={textColor}>
      <Inner>
        <Start>
          {back}

          <Status
            role="group"
            aria-labelledby={statusId}
          >
            <StatePill state={state}>
              <span id={statusId}>{stateLabel}</span>
            </StatePill>

            {meta && <Meta>{meta}</Meta>}
          </Status>

          {title && <Title>{title}</Title>}

          {statusAction && <StatusAction>{statusAction}</StatusAction>}
        </Start>

        <Actions>
          <Group>
            <EditorHeaderMenu actions={menuActions} />
            {secondaryActions}
          </Group>
          {(secondaryActions || menuActions.length > 0) && primaryActions && (
            <Divider />
          )}
          <PrimaryGroup>{primaryActions}</PrimaryGroup>
        </Actions>
      </Inner>
    </Bar>
  );
}

export interface EditorHeaderButtonProps extends Omit<ButtonProps, 'variant'> {
  label: string;
  icon?: ReactNode;
  collapse?: 'md' | 'sm' | false;
  variant?: ButtonProps['variant'];
}

export function EditorHeaderButton({
  label,
  icon,
  collapse = 'md',
  variant = 'text',
  ...props
}: EditorHeaderButtonProps) {
  return (
    <Button
      title={collapse ? label : undefined}
      aria-label={label}
      data-collapse={collapse || undefined}
      variant={variant}
      startIcon={icon}
      {...props}
    >
      <span data-label>{label}</span>
    </Button>
  );
}

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import {
  MdArrowDownward,
  MdArrowUpward,
  MdDragIndicator,
  MdPushPin,
  MdWidthFull,
} from 'react-icons/md';

import {
  DASHBOARD_CARDS,
  DashboardCardId,
  DashboardLayout,
  defaultDashboardLayout,
  moveDashboardCard,
  setDashboardCardFullWidth,
  setDashboardCardVisible,
} from './dashboardLayout';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
} from '@mui/material';

export const DASHBOARD_CARD_TITLE_KEYS: Record<DashboardCardId, string> = {
  notifications: 'dashboard.notifications',
  network: 'dashboard.networkContent',
  activity: 'dashboard.activity',
  audience: 'dashboard.audience',
  externalApps: 'dashboard.externalApps',
};

const CardList = styled.ul`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const CardRow = styled.li`
  display: grid;
  grid-template-columns: auto 1fr auto auto 30px;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius + 'px'};
  background: ${({ theme }) => theme.vars.palette.background.paper};
`;

const Handle = styled.span`
  display: flex;
  cursor: grab;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  touch-action: none;
`;

const Pinned = styled.span`
  display: flex;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const SectionInfo = styled.p`
  margin: 16px 0 8px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

type SortableCardProps = {
  id: DashboardCardId;
  visible: boolean;
  fullWidth: boolean;
  canSpanFullWidth: boolean;
  isFirst: boolean;
  isLast: boolean;
  onVisibleChange: (visible: boolean) => void;
  onFullWidthChange: (fullWidth: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function SortableCard({
  id,
  visible,
  fullWidth,
  canSpanFullWidth,
  isFirst,
  isLast,
  onVisibleChange,
  onFullWidthChange,
  onMoveUp,
  onMoveDown,
}: SortableCardProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  return (
    <CardRow
      ref={setNodeRef}
      data-dashboard-config-card={id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Handle
        {...attributes}
        {...listeners}
        title={t('dashboard.dragToMove')}
      >
        <MdDragIndicator size={20} />
      </Handle>

      <FormControlLabel
        control={
          <Checkbox
            checked={visible}
            onChange={(_event, checked) => onVisibleChange(checked)}
          />
        }
        label={t(DASHBOARD_CARD_TITLE_KEYS[id])}
      />

      <IconButton
        size="small"
        disabled={isFirst}
        aria-label={t('dashboard.moveUp')}
        title={t('dashboard.moveUp')}
        onClick={onMoveUp}
      >
        <MdArrowUpward />
      </IconButton>

      <IconButton
        size="small"
        disabled={isLast}
        aria-label={t('dashboard.moveDown')}
        title={t('dashboard.moveDown')}
        onClick={onMoveDown}
      >
        <MdArrowDownward />
      </IconButton>

      {canSpanFullWidth ?
        <IconButton
          size="small"
          color={fullWidth ? 'primary' : 'default'}
          disabled={!visible}
          aria-pressed={fullWidth}
          aria-label={t('dashboard.fullWidth')}
          title={t('dashboard.fullWidth')}
          onClick={() => onFullWidthChange(!fullWidth)}
        >
          <MdWidthFull />
        </IconButton>
      : <span />}
    </CardRow>
  );
}

export type DashboardConfigProps = {
  open: boolean;
  layout: DashboardLayout;
  onChange: (layout: DashboardLayout) => void;
  onClose: () => void;
};

export function DashboardConfig({
  open,
  layout,
  onChange,
  onClose,
}: DashboardConfigProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onChange(
        moveDashboardCard(
          layout,
          active.id as DashboardCardId,
          over.id as DashboardCardId
        )
      );
    }
  };

  const neighbour = (index: number) => layout.cards[index]?.id;

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      maxWidth="sm"
    >
      <DialogTitle>{t('dashboard.configureTitle')}</DialogTitle>

      <DialogContent>
        <SectionInfo>{t('dashboard.configureFixedInfo')}</SectionInfo>
        <CardList>
          {DASHBOARD_CARDS.filter(card => card.sticky).map(({ id }) => (
            <CardRow key={id}>
              <Pinned title={t('dashboard.fixedCard')}>
                <MdPushPin size={20} />
              </Pinned>
              <span>{t(DASHBOARD_CARD_TITLE_KEYS[id])}</span>
            </CardRow>
          ))}
        </CardList>

        <SectionInfo>{t('dashboard.configureInfo')}</SectionInfo>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={layout.cards.map(card => card.id)}
            strategy={verticalListSortingStrategy}
          >
            <CardList>
              {layout.cards.map((card, index) => (
                <SortableCard
                  key={card.id}
                  id={card.id}
                  visible={card.visible}
                  fullWidth={!!card.fullWidth}
                  canSpanFullWidth={DASHBOARD_CARDS.some(
                    definition =>
                      definition.id === card.id && definition.canSpanFullWidth
                  )}
                  isFirst={index === 0}
                  isLast={index === layout.cards.length - 1}
                  onVisibleChange={visible =>
                    onChange(setDashboardCardVisible(layout, card.id, visible))
                  }
                  onFullWidthChange={fullWidth =>
                    onChange(
                      setDashboardCardFullWidth(layout, card.id, fullWidth)
                    )
                  }
                  onMoveUp={() =>
                    onChange(
                      moveDashboardCard(layout, card.id, neighbour(index - 1))
                    )
                  }
                  onMoveDown={() =>
                    onChange(
                      moveDashboardCard(layout, card.id, neighbour(index + 1))
                    )
                  }
                />
              ))}
            </CardList>
          </SortableContext>
        </DndContext>
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={() => onChange(defaultDashboardLayout())}
        >
          {t('dashboard.resetLayout')}
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
        >
          {t('dashboard.configureDone')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

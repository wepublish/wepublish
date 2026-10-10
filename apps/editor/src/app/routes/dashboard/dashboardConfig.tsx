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
} from 'react-icons/md';
import { Button, Checkbox, IconButton, Modal } from 'rsuite';

import {
  DASHBOARD_CARDS,
  DashboardCardId,
  DashboardLayout,
  defaultDashboardLayout,
  moveDashboardCard,
  setDashboardCardVisible,
} from './dashboardLayout';

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
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid var(--rs-border-primary);
  border-radius: var(--rs-radius-lg, 6px);
  background: var(--rs-bg-card);
`;

const Handle = styled.span`
  display: flex;
  cursor: grab;
  color: var(--rs-text-secondary);
  touch-action: none;
`;

const Pinned = styled.span`
  display: flex;
  color: var(--rs-text-secondary);
`;

const SectionInfo = styled.p`
  margin: 16px 0 8px;
  color: var(--rs-text-secondary);
`;

type SortableCardProps = {
  id: DashboardCardId;
  visible: boolean;
  isFirst: boolean;
  isLast: boolean;
  onVisibleChange: (visible: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function SortableCard({
  id,
  visible,
  isFirst,
  isLast,
  onVisibleChange,
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

      <Checkbox
        checked={visible}
        onChange={(_, checked) => onVisibleChange(checked)}
      >
        {t(DASHBOARD_CARD_TITLE_KEYS[id])}
      </Checkbox>

      <IconButton
        size="sm"
        appearance="subtle"
        icon={<MdArrowUpward />}
        disabled={isFirst}
        aria-label={t('dashboard.moveUp')}
        title={t('dashboard.moveUp')}
        onClick={onMoveUp}
      />

      <IconButton
        size="sm"
        appearance="subtle"
        icon={<MdArrowDownward />}
        disabled={isLast}
        aria-label={t('dashboard.moveDown')}
        title={t('dashboard.moveDown')}
        onClick={onMoveDown}
      />
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
    <Modal
      open={open}
      onClose={onClose}
      size="xs"
    >
      <Modal.Header>
        <Modal.Title>{t('dashboard.configureTitle')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
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
                  isFirst={index === 0}
                  isLast={index === layout.cards.length - 1}
                  onVisibleChange={visible =>
                    onChange(setDashboardCardVisible(layout, card.id, visible))
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
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="subtle"
          onClick={() => onChange(defaultDashboardLayout())}
        >
          {t('dashboard.resetLayout')}
        </Button>
        <Button
          appearance="primary"
          onClick={onClose}
        >
          {t('dashboard.configureDone')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

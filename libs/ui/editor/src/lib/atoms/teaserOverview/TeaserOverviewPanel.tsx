import styled from '@emotion/styled';
import { Chip, Collapse, css, Typography } from '@mui/material';
import { TeaserType } from '@wepublish/editor/api';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdEditNote,
  MdExpandLess,
  MdExpandMore,
  MdGridView,
} from 'react-icons/md';
import { Drawer, IconButton } from 'rsuite';

import { BlockValue, Teaser } from '../../blocks/types';
import { TeaserSelectAndEditPanel } from '../../panel/teaserSelectAndEditPanel';
import {
  ExtractedTeaser,
  extractTeasers,
  TeaserAddress,
  teaserContentKey,
} from './extractTeasers';
import { setTeaserAt, swapTeasers } from './swapTeasers';
import { TeaserBlockGroup } from './TeaserBlockGroup';

const PanelWrapper = styled('div')`
  width: 100%;
  margin-bottom: 16px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 8px;
`;

const Header = styled('button', {
  shouldForwardProp: p => p !== 'isOpen',
})<{ isOpen: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f7f9fa;
  border: none;
  border-radius: ${({ isOpen }) => (isOpen ? '7px 7px 0 0' : '7px')};
  transition: border-radius 0ms ${({ isOpen }) => (isOpen ? '0ms' : '250ms')};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: #eef1f3;
  }
`;

const HeaderIcon = styled('div')`
  font-size: 20px;
  color: ${({ theme }) => theme.palette.text.secondary};
  display: flex;
  align-items: center;
`;

const HeaderTitle = styled(Typography)`
  ${({ theme }) => css`
    font-size: ${theme.typography.body2.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.palette.text.primary};
    flex: 1;
  `}
`;

const HeaderMeta = styled(Typography)`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    color: ${theme.palette.text.secondary};
  `}
`;

const ChevronIcon = styled('div')`
  font-size: 20px;
  color: ${({ theme }) => theme.palette.text.secondary};
  display: flex;
  align-items: center;
`;

const Content = styled('div')`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-radius: 0 0 7px 7px;
  background: ${({ theme }) => theme.palette.background.default};
`;

const SelectionHint = styled('div', {
  shouldForwardProp: p => p !== 'visible',
})<{ visible: boolean }>`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    color: ${theme.palette.primary.main}99;
    background: #eef4fb;
    border: 1px solid ${theme.palette.primary.light}55;
    border-radius: 4px;
    padding: 4px 8px 4px 12px;
  `}
  position: sticky;
  top: 50px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.15s;
`;

const HintText = styled('span')`
  flex: 1;
  ${({ theme }) => css`
    color: ${theme.palette.primary.dark};
  `}
`;

const HintActions = styled('div')`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const FilterBar = styled('div')`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  background: #f7f9fa;
`;

const FilterLabel = styled(Typography)`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    color: ${theme.palette.text.secondary};
    margin-right: 4px;
  `}
`;

const ChipCount = styled('span', {
  shouldForwardProp: p => p !== 'active',
})<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  margin-left: 4px;
  background: ${({ active, theme }) =>
    active ? 'rgba(255,255,255,0.25)' : theme.palette.action.hover};
  color: ${({ active, theme }) =>
    active ? '#fff' : theme.palette.text.secondary};
`;

const EmptyState = styled(Typography)`
  ${({ theme }) => css`
    color: ${theme.palette.text.disabled};
    text-align: center;
    padding: 16px;
  `}
`;

const ALL_TEASER_TYPES = [
  TeaserType.Article,
  TeaserType.Page,
  TeaserType.Event,
  TeaserType.Custom,
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

type TeaserOverviewPanelProps = {
  blocks: BlockValue[];
  onChange: (blocks: BlockValue[]) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeaserOverviewPanel({
  blocks,
  onChange,
}: TeaserOverviewPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<TeaserAddress | null>(
    null
  );
  const [replaceAddress, setReplaceAddress] = useState<TeaserAddress | null>(
    null
  );
  const [activeFilters, setActiveFilters] = useState<Set<TeaserType>>(
    () => new Set([TeaserType.Article])
  );

  const allTeasers = useMemo(() => extractTeasers(blocks, t), [blocks, t]);

  const isFiltering = activeFilters.size !== ALL_TEASER_TYPES.length;

  const teaserCountsByType = useMemo(() => {
    const counts = new Map<TeaserType, number>();
    for (const { teaser } of allTeasers) {
      counts.set(teaser.type, (counts.get(teaser.type) ?? 0) + 1);
    }
    return counts;
  }, [allTeasers]);

  // Group by blockLabel, preserving order of first appearance
  const groups = useMemo(() => {
    const seen = new Map<
      string,
      { label: string; groupIndex: number; teasers: ExtractedTeaser[] }
    >();

    for (const extracted of allTeasers) {
      const key = `${extracted.address.blockIndex}-${extracted.blockLabel}`;
      if (!seen.has(key)) {
        seen.set(key, {
          label: extracted.blockLabel,
          groupIndex: extracted.groupIndex,
          teasers: [],
        });
      }
      seen.get(key)!.teasers.push(extracted);
    }

    return [...seen.values()];
  }, [allTeasers]);

  // Filtered groups: only show groups that have at least one matching teaser
  const filteredGroups = useMemo(() => {
    if (!isFiltering) return groups;

    return groups
      .map(group => ({
        ...group,
        teasers: group.teasers.filter(t => activeFilters.has(t.teaser.type)),
      }))
      .filter(group => group.teasers.length > 0);
  }, [groups, activeFilters, isFiltering]);

  const visibleTeaserCount = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.teasers.length, 0),
    [filteredGroups]
  );

  const toggleFilter = useCallback((type: TeaserType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleCardClick = useCallback(
    (extracted: ExtractedTeaser) => {
      if (!selectedAddress) {
        setSelectedAddress(extracted.address);
        return;
      }

      const clickingSame = addressesEqual(extracted.address, selectedAddress);
      if (clickingSame) {
        setSelectedAddress(null);
        return;
      }

      // Swap the two teasers
      onChange(swapTeasers(blocks, selectedAddress, extracted.address));
      setSelectedAddress(null);
    },
    [selectedAddress, blocks, onChange]
  );

  const handleReplaceClick = useCallback(() => {
    setReplaceAddress(selectedAddress);
  }, [selectedAddress]);

  const handleReplaceConfirm = useCallback(
    (teaser: Teaser) => {
      if (!replaceAddress) return;
      onChange(setTeaserAt(blocks, replaceAddress, teaser));
      setReplaceAddress(null);
      setSelectedAddress(null);
    },
    [replaceAddress, blocks, onChange]
  );

  const handleReplaceClose = useCallback(() => {
    setReplaceAddress(null);
    setSelectedAddress(null);
  }, []);

  // Keys that appear more than once on the page
  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { teaser } of allTeasers) {
      const key = teaserContentKey(teaser);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const dupes = new Set<string>();
    for (const [key, count] of counts) {
      if (count > 1) dupes.add(key);
    }
    return dupes;
  }, [allTeasers]);

  // Hide entirely when there are no curated teasers
  if (allTeasers.length === 0) return null;

  const summary = t(
    groups.length === 1 ?
      'teaserOverview.summaryOne'
    : 'teaserOverview.summaryMany',
    {
      count: allTeasers.length,
      blocks: groups.length,
    }
  );

  const filterSuffix =
    isFiltering ?
      ` (${t('teaserOverview.filterSuffix', { count: visibleTeaserCount })})`
    : '';

  return (
    <>
      <PanelWrapper>
        <Header
          isOpen={isOpen}
          onClick={() => {
            setIsOpen(v => !v);
            // Deselect on collapse
            if (isOpen) setSelectedAddress(null);
          }}
          aria-expanded={isOpen}
        >
          <HeaderIcon>
            <MdGridView />
          </HeaderIcon>

          <HeaderTitle variant="body2">{t('teaserOverview.title')}</HeaderTitle>

          <HeaderMeta variant="caption">
            {summary}
            {filterSuffix}
          </HeaderMeta>

          <ChevronIcon>
            {isOpen ?
              <MdExpandLess />
            : <MdExpandMore />}
          </ChevronIcon>
        </Header>

        <Collapse in={isOpen}>
          <FilterBar>
            <FilterLabel variant="caption">
              {t('teaserOverview.filterLabel')}
            </FilterLabel>
            {ALL_TEASER_TYPES.map(type => (
              <Chip
                key={type}
                label={
                  <>
                    {t(`teaserOverview.teaserTypes.${type}`)}
                    <ChipCount active={activeFilters.has(type)}>
                      {teaserCountsByType.get(type) ?? 0}
                    </ChipCount>
                  </>
                }
                size="small"
                variant={activeFilters.has(type) ? 'filled' : 'outlined'}
                color={activeFilters.has(type) ? 'primary' : 'default'}
                disabled={!!selectedAddress}
                onClick={e => {
                  e.stopPropagation();
                  toggleFilter(type);
                }}
              />
            ))}
          </FilterBar>

          <Content>
            <SelectionHint visible={!!selectedAddress}>
              <HintText>{t('teaserOverview.hintText')}</HintText>
              <HintActions>
                <IconButton
                  size="xs"
                  appearance="primary"
                  icon={<MdEditNote />}
                  onClick={handleReplaceClick}
                  title={t('teaserOverview.replaceButtonTitle')}
                >
                  {t('teaserOverview.replaceButton')}
                </IconButton>
              </HintActions>
            </SelectionHint>

            {filteredGroups.length === 0 && (
              <EmptyState variant="body2">
                {t('teaserOverview.emptyState')}
              </EmptyState>
            )}

            {filteredGroups.map((group, i) => (
              <TeaserBlockGroup
                key={i}
                label={group.label}
                groupIndex={group.groupIndex}
                teasers={group.teasers}
                duplicateKeys={duplicateKeys}
                selectedAddress={selectedAddress}
                onCardClick={handleCardClick}
              />
            ))}
          </Content>
        </Collapse>
      </PanelWrapper>

      <Drawer
        open={replaceAddress !== null}
        size="sm"
        onClose={handleReplaceClose}
      >
        <TeaserSelectAndEditPanel
          onClose={handleReplaceClose}
          onSelect={teaser => {
            handleReplaceConfirm(teaser);
          }}
        />
      </Drawer>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addressesEqual(a: TeaserAddress, b: TeaserAddress | null): boolean {
  if (!b) return false;
  if (a.blockKind !== b.blockKind) return false;
  if (a.blockIndex !== b.blockIndex) return false;

  switch (a.blockKind) {
    case 'teaserGrid':
      return b.blockKind === 'teaserGrid' && a.teaserIndex === b.teaserIndex;
    case 'teaserFlex':
      return b.blockKind === 'teaserFlex' && a.flexIndex === b.flexIndex;
    case 'teaserSlots':
      return b.blockKind === 'teaserSlots' && a.slotIndex === b.slotIndex;
    case 'flexNested':
      return (
        b.blockKind === 'flexNested' &&
        a.nestedBlockIndex === b.nestedBlockIndex &&
        addressesEqual(a.nested, b.nested)
      );
  }
}

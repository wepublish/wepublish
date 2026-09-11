import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbColumns, TbColumnsOff } from 'react-icons/tb';
import { Checkbox, IconButton } from 'rsuite';

export type ColumnConfiguratorColumn = {
  id: string;
  label: string;
};

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const Options = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 10;
  padding: 8px 12px;
  white-space: nowrap;
  background-color: var(--rs-bg-overlay, #fff);
  border: 1px solid var(--rs-border-primary, #e5e5ea);
  border-radius: 6px;
  box-shadow: var(--rs-shadow-overlay, 0 4px 12px rgba(0, 0, 0, 0.15));
`;

const OptionsHeader = styled.h6`
  margin: 0 0 8px;
  padding: 6px 0 0 6px;
  font-size: 0.75em;
  font-weight: 400;
  opacity: 0.6;
`;

export type ColumnConfiguratorProps = {
  columns: ReadonlyArray<ColumnConfiguratorColumn>;
  isVisible: (id: string) => boolean;
  onToggle: (id: string) => void;
  title?: string;
};

export const ColumnConfigurator = ({
  columns,
  isVisible,
  onToggle,
  title,
}: ColumnConfiguratorProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const label = title ?? t('columnConfigurator.title');

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [expanded]);

  return (
    <Wrapper ref={wrapperRef}>
      <IconButton
        size="sm"
        appearance="subtle"
        title={label}
        aria-label={label}
        aria-expanded={expanded}
        icon={expanded ? <TbColumnsOff /> : <TbColumns />}
        onClick={() => setExpanded(expanded => !expanded)}
      />

      {expanded && (
        <Options>
          <OptionsHeader>{label}</OptionsHeader>

          {columns.map(column => (
            <Checkbox
              key={column.id}
              checked={isVisible(column.id)}
              onChange={() => onToggle(column.id)}
            >
              {column.label}
            </Checkbox>
          ))}
        </Options>
      )}
    </Wrapper>
  );
};

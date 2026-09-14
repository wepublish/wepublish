import styled from '@emotion/styled';
import { PuckComponent, registerOverlayPortal, Slot } from '@puckeditor/core';
import {
  MouseEvent,
  PropsWithChildren,
  Ref,
  SyntheticEvent,
  useCallback,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdExpandMore } from 'react-icons/md';

export type CollapsibleProps = PropsWithChildren<{
  className?: string;
  title: string;
  defaultOpen?: boolean;
  refs?: {
    toggle?: Ref<HTMLButtonElement | null>;
  };
}>;

export type CollapsibleConfigProps = Omit<CollapsibleProps, 'children'> & {
  content: Slot;
};

const CollapsibleWrapper = styled('details')`
  interpolate-size: allow-keywords;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};

  &::details-content {
    block-size: 0;
    overflow-y: clip;
    transition:
      block-size 0.3s ease-in-out,
      content-visibility 0.3s ease-in-out allow-discrete;
  }

  &[open]::details-content {
    block-size: auto;
  }
`;

const CollapsibleSummary = styled('summary')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2, 0)};
  cursor: pointer;
  list-style: none;
  font-weight: 500;
  user-select: none;

  &::-webkit-details-marker {
    display: none;
  }
`;

const CollapsibleToggle = styled('button')`
  display: inline-flex;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;

  svg {
    transition: rotate 0.3s ease-in-out;
  }

  details[open] & svg {
    rotate: 180deg;
  }
`;

const CollapsibleContent = styled('div')`
  padding-bottom: ${({ theme }) => theme.spacing(2)};
`;

export const Collapsible = ({
  className,
  title,
  defaultOpen = false,
  refs,
  children,
}: CollapsibleProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  const onToggle = useCallback(
    (event: SyntheticEvent<HTMLDetailsElement>) =>
      setOpen(event.currentTarget.open),
    []
  );

  const onButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpen(isOpen => !isOpen);
  }, []);

  return (
    <CollapsibleWrapper
      className={className}
      open={open}
      onToggle={onToggle}
    >
      <CollapsibleSummary>
        {title}

        <CollapsibleToggle
          type="button"
          aria-label={
            open ? t('collapsible.collapse') : t('collapsible.expand')
          }
          onClick={onButtonClick}
          ref={refs?.toggle}
        >
          <MdExpandMore size={24} />
        </CollapsibleToggle>
      </CollapsibleSummary>

      <CollapsibleContent>{children}</CollapsibleContent>
    </CollapsibleWrapper>
  );
};

export const CollapsibleRender: PuckComponent<CollapsibleConfigProps> = ({
  content: Content,
  defaultOpen,
  puck,
  ...props
}) => (
  <Collapsible
    {...props}
    defaultOpen={defaultOpen || puck.isEditing}
    refs={{ toggle: registerOverlayPortal }}
  >
    <Content minEmptyHeight={120} />
  </Collapsible>
);

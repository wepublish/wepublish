import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';

import { useCommandPalette } from './commandPaletteContext';
import { modifierKeyLabel } from './modifierKeyLabel';

const Trigger = styled.button`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--wep-shell-border);
  border-radius: 8px;
  background: none;
  font: inherit;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: var(--wep-nav-hover-bg);
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
  }

  > svg {
    width: 17px;
    height: 17px;
  }
`;

const Shortcut = styled.span`
  display: inline-flex;
  gap: 2px;
  font-size: 0.6875rem;
  letter-spacing: 0.02em;
  opacity: 0.85;
`;

export function CommandPaletteTrigger({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { open } = useCommandPalette();

  return (
    <Trigger
      type="button"
      className={className}
      onClick={open}
    >
      <MdSearch aria-hidden />
      {t('commandPalette.trigger')}
      <Shortcut aria-hidden>{modifierKeyLabel()} K</Shortcut>
    </Trigger>
  );
}

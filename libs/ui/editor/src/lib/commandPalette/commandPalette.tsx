import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { Dialog } from '@mui/material';
import {
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import type { CommandMatch } from './command';
import { useCommandPalette } from './commandPaletteContext';
import { groupMatches } from './groupMatches';
import { searchCommands } from './searchCommands';

const LIST_ID = 'command-palette-results';
const rowId = (index: number) => `command-palette-row-${index}`;

const Surface = styled.div`
  display: flex;
  flex-direction: column;
  max-height: min(60vh, 520px);
  color: ${({ theme }) => theme.vars.palette.text.primary};
`;

const Search = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--wep-shell-border);

  > svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.vars.palette.text.secondary};
  }
`;

const Input = styled.input`
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  font: inherit;
  font-size: 1rem;
  line-height: 1.5;
  color: inherit;
  caret-color: ${({ theme }) => theme.vars.palette.primary.main};

  &::placeholder {
    color: ${({ theme }) => theme.vars.palette.text.secondary};
  }
`;

const Results = styled.div`
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgb(
      from ${({ theme }) => theme.vars.palette.text.primary} r g b / 22%
    )
    transparent;
`;

const GroupLabel = styled.div`
  padding: 10px 10px 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--wep-nav-text);
  scroll-margin: 6px;

  > svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: inherit;
  }

  &[data-selected='true'] {
    background-color: var(--wep-nav-active-bg);
    box-shadow: inset 0 0 0 1px var(--wep-nav-active-ring);
    color: ${({ theme }) => theme.vars.palette.text.primary};

    > svg {
      color: var(--wep-nav-active-text);
    }
  }

  &:hover:not([data-selected='true']) {
    background-color: var(--wep-nav-hover-bg);
    color: var(--wep-nav-hover-text);
  }
`;

const Title = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  mark {
    background: none;
    color: inherit;
    font-weight: 700;
  }
`;

const Section = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  white-space: nowrap;
`;

const Empty = styled.div`
  padding: 28px 18px 32px;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.vars.palette.text.secondary};

  strong {
    color: ${({ theme }) => theme.vars.palette.text.primary};
    font-weight: 600;
  }
`;

const Hints = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid var(--wep-shell-border);
  font-size: 0.6875rem;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Hint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  kbd {
    min-width: 18px;
    padding: 1px 5px;
    border-radius: 4px;
    background-color: var(--wep-nav-hover-bg);
    font-family: inherit;
    font-size: 0.6875rem;
    line-height: 1.5;
    text-align: center;
  }
`;

const Highlighted = ({
  text,
  indices,
}: {
  text: string;
  indices: number[];
}) => {
  if (!indices.length) {
    return <>{text}</>;
  }

  const matched = new Set(indices);

  return (
    <>
      {[...text]
        .reduce<{ runs: { text: string; hit: boolean }[] }>(
          (state, character, index) => {
            const hit = matched.has(index);
            const last = state.runs[state.runs.length - 1];

            if (last && last.hit === hit) {
              last.text += character;
            } else {
              state.runs.push({ text: character, hit });
            }

            return state;
          },
          { runs: [] }
        )
        .runs.map((run, index) =>
          run.hit ?
            <mark key={index}>{run.text}</mark>
          : <span key={index}>{run.text}</span>
        )}
    </>
  );
};

export function CommandPalette() {
  const { t } = useTranslation();
  const { isOpen, close, commands } = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(
    () => searchCommands(commands, query),
    [commands, query]
  );
  const groups = useMemo(
    () => groupMatches(matches, !query.trim()),
    [matches, query]
  );

  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);

    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }

  useEffect(() => {
    resultsRef.current
      ?.querySelector(`#${CSS.escape(rowId(activeIndex))}`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, matches]);

  const run = (match: CommandMatch | undefined) => {
    if (!match) {
      return;
    }

    close();
    match.command.perform({ navigate, close });
  };

  const move = (delta: number) => {
    if (!matches.length) {
      return;
    }

    setActiveIndex(
      current => (current + delta + matches.length) % matches.length
    );
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Home: () => setActiveIndex(0),
      End: () => setActiveIndex(Math.max(matches.length - 1, 0)),
      Enter: () => run(matches[activeIndex]),
    };

    const handler = keys[event.key];

    if (handler) {
      event.preventDefault();
      handler();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      aria-label={t('commandPalette.title')}
      maxWidth={false}
      slotProps={{
        backdrop: { sx: { backgroundColor: 'rgb(0 0 0 / 55%)' } },
        container: { sx: { alignItems: 'flex-start', pt: '11vh' } },
        paper: {
          sx: {
            width: 'min(640px, calc(100vw - 32px))',
            m: 0,
            borderRadius: '14px',
            backgroundImage: 'none',
            boxShadow: 'var(--wep-elevated-shadow)',
            animation: 'wep-command-palette-in 180ms cubic-bezier(.16,1,.3,1)',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          },
        },
      }}
    >
      <Global
        styles={css`
          @keyframes wep-command-palette-in {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.985);
            }
          }
        `}
      />

      <Surface>
        <Search>
          <MdSearch aria-hidden />

          <Input
            autoFocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={LIST_ID}
            aria-activedescendant={
              matches.length ? rowId(activeIndex) : undefined
            }
            aria-label={t('commandPalette.title')}
            autoComplete="off"
            spellCheck={false}
            placeholder={t('commandPalette.placeholder')}
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
          />
        </Search>

        <Results ref={resultsRef}>
          <div
            id={LIST_ID}
            role="listbox"
            aria-label={t('commandPalette.title')}
          >
            {groups.map(group => (
              <div
                key={group.group}
                role="group"
                aria-label={t(`commandPalette.groups.${group.group}`)}
              >
                <GroupLabel aria-hidden>
                  {t(`commandPalette.groups.${group.group}`)}
                </GroupLabel>

                {group.matches.map(match => (
                  <Row
                    key={match.command.id}
                    id={rowId(match.index)}
                    role="option"
                    aria-selected={match.index === activeIndex}
                    data-selected={match.index === activeIndex}
                    onMouseMove={() => setActiveIndex(match.index)}
                    onClick={() => run(match)}
                  >
                    {match.command.icon}

                    <Title>
                      <Highlighted
                        text={match.command.title}
                        indices={match.indices}
                      />
                    </Title>

                    <Section>{match.command.section}</Section>
                  </Row>
                ))}
              </div>
            ))}
          </div>

          {!matches.length && (
            <Empty>
              {t('commandPalette.empty')} <strong>{query.trim()}</strong>
            </Empty>
          )}
        </Results>

        <Hints>
          <Hint>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {t('commandPalette.hints.move')}
          </Hint>
          <Hint>
            <kbd>↵</kbd> {t('commandPalette.hints.select')}
          </Hint>
          <Hint>
            <kbd>{t('commandPalette.keys.escape')}</kbd>{' '}
            {t('commandPalette.hints.close')}
          </Hint>
        </Hints>
      </Surface>
    </Dialog>
  );
}

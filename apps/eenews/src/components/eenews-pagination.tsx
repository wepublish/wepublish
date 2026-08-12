import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const Nav = styled('nav')`
  max-width: var(--max-width);
  margin: 56px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const buttonBase = (theme: Theme) => `
  min-width: 42px;
  height: 42px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: ${theme.palette.primary.main};
  border: 0;
  border-radius: 5px;
  font-family: inherit;
  font-weight: 700;
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 120ms,
    color 120ms;
`;

const PageNum = styled('button', {
  shouldForwardProp: p => p !== 'isActive',
})<{ isActive: boolean }>`
  ${({ theme }) => buttonBase(theme)}
  background: ${({ theme, isActive }) =>
    isActive ? theme.palette.primary.main : 'transparent'};
  color: ${({ theme, isActive }) =>
    isActive ? theme.palette.secondary.main : theme.palette.primary.main};
  &:hover {
    background: ${({ theme, isActive }) =>
      isActive ? theme.palette.primary.main : 'rgba(25, 90, 125, 0.10)'};
  }
`;

const PageArrow = styled('button')`
  ${({ theme }) => buttonBase(theme)}
  padding: 0;
  width: 42px;
  &:hover:not(:disabled) {
    background: rgba(25, 90, 125, 0.1);
  }
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const Ellipsis = styled('span')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 42px;
  color: ${({ theme }) => theme.palette.primary.main};
  font-family: inherit;
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.05em;
`;

export type EenewsPaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

export const EenewsPagination = ({
  page,
  totalPages,
  onChange,
  className,
}: EenewsPaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const nums = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const items = [...nums]
    .filter(n => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const parts: Array<{ type: 'num' | 'gap'; n: number }> = [];
  let prev = 0;
  for (const n of items) {
    if (n - prev > 1) {
      parts.push({ type: 'gap', n });
    }
    parts.push({ type: 'num', n });
    prev = n;
  }

  return (
    <Nav
      className={className}
      aria-label="Seiten"
    >
      <PageArrow
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Zurück"
      >
        <MdChevronLeft size={22} />
      </PageArrow>

      {parts.map((p, idx) =>
        p.type === 'gap' ?
          <Ellipsis key={`gap-${idx}`}>…</Ellipsis>
        : <PageNum
            key={`n-${p.n}`}
            type="button"
            isActive={p.n === page}
            onClick={() => onChange(p.n)}
            aria-current={p.n === page ? 'page' : undefined}
          >
            {p.n}
          </PageNum>
      )}

      <PageArrow
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Weiter"
      >
        <MdChevronRight size={22} />
      </PageArrow>
    </Nav>
  );
};

import theme from './theme';

vi.mock('next/font/local', () => ({
  default: () => ({ className: '', style: { fontFamily: 'serif' } }),
}));

vi.mock('next/font/google', () => ({
  Roboto_Mono: () => ({ className: '', style: { fontFamily: 'monospace' } }),
}));

type StyleRules = Record<string, Record<string, unknown>>;

const accordionRootStyles = () =>
  (
    theme.components?.MuiAccordion?.styleOverrides as {
      root: StyleRules;
    }
  ).root;

describe('reflekt theme accordion', () => {
  it('places the MUI heading wrapper of the summary across the full grid row', () => {
    expect(accordionRootStyles()['.MuiAccordion-heading']).toMatchObject({
      gridColumn: '-1 / 1',
      gridRow: '1 / 2',
      display: 'grid',
      gridTemplateColumns: 'subgrid',
    });
  });

  it('keeps the summary button on the same subgrid inside the heading', () => {
    expect(accordionRootStyles()['.MuiAccordionSummary-root']).toMatchObject({
      gridColumn: '-1 / 1',
      gridTemplateColumns: 'subgrid',
    });
  });
});

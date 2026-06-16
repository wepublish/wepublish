import { render } from '@testing-library/react';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import { MemberPlanPicker } from './memberplan-picker';

jest.mock('@wepublish/richtext', () => ({
  toPlaintext: () => '',
}));

jest.mock('@wepublish/website/builder', () => ({
  useWebsiteBuilder: () => ({
    MemberPlanItem: ({ name }: { name: string }) => (
      <span data-testid="plan">{name}</span>
    ),
    elements: { Image: () => null },
    blocks: { RichText: () => null },
  }),
}));

const theme = createTheme();

// Deliberately NOT in ascending price order.
const plans = [
  { id: 'p3000', amountPerMonthMin: 3000 },
  { id: 'p750', amountPerMonthMin: 750 },
  { id: 'p2000', amountPerMonthMin: 2000 },
].map(p => ({
  ...p,
  slug: p.id,
  name: p.id,
  currency: 'CHF',
  amountPerMonthMax: 30000,
  extendable: true,
  shortDescription: undefined,
  description: undefined,
  image: undefined,
  tags: [],
})) as never[];

const planOrder = () =>
  Array.from(document.querySelectorAll('.MuiFormControlLabel-label')).map(
    el => el.textContent
  );

const renderPicker = (sortBy?: 'priceAsc') =>
  render(
    <ThemeProvider theme={theme}>
      <MemberPlanPicker
        memberPlans={plans}
        value="p3000"
        onChange={() => undefined}
        sortBy={sortBy}
      />
    </ThemeProvider>
  );

describe('MemberPlanPicker sorting', () => {
  it('keeps the given order by default (no sortBy) — unchanged for existing apps', () => {
    renderPicker(undefined);
    expect(planOrder()).toEqual(['p3000', 'p750', 'p2000']);
  });

  it('sorts by amountPerMonthMin ascending when sortBy="priceAsc"', () => {
    renderPicker('priceAsc');
    expect(planOrder()).toEqual(['p750', 'p2000', 'p3000']);
  });
});

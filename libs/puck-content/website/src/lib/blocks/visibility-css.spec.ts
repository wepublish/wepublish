import { createTheme } from '@mui/material';
import {
  FullPuckBlockFragment,
  PuckBlockVisibility,
} from '@wepublish/website/api';

import { visibilityCss } from './visibility-css';

const theme = createTheme();

describe('visibilityCss', () => {
  it('hides the block on the breakpoints it is not shown on', () => {
    expect(visibilityCss(theme, { breakpoints: ['md', 'lg', 'xl'] })).toEqual({
      [theme.breakpoints.only('xs')]: { display: 'none' },
      [theme.breakpoints.only('sm')]: { display: 'none' },
    });
  });

  it('shows the block everywhere without breakpoints', () => {
    expect(visibilityCss(theme, undefined)).toEqual({});
    expect(visibilityCss(theme, null)).toEqual({});
    expect(visibilityCss(theme, { breakpoints: null })).toEqual({});
  });

  it('never dims a disabled block', () => {
    expect(visibilityCss(theme, { disabled: true })).toEqual({});
  });

  it('accepts the visibility types of the website API', () => {
    type Visibility = Parameters<typeof visibilityCss>[1];

    expectTypeOf<PuckBlockVisibility>().toExtend<Visibility>();
    expectTypeOf<FullPuckBlockFragment['visibility']>().toExtend<Visibility>();
  });
});

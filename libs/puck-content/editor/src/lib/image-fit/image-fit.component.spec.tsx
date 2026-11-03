import { fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import {
  AspectRatioFieldRender,
  ObjectFitFieldRender,
} from './image-fit.component';

beforeAll(async () => {
  await i18next.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: { translation: i18next.getResourceBundle('en', 'translation') },
    },
    interpolation: { escapeValue: false },
  });
});

const renderAspectRatio = (value?: string) => {
  const onChange = vi.fn();

  render(
    <AspectRatioFieldRender
      id="ratio"
      name="ratio"
      field={{ type: 'aspectRatio' }}
      value={value}
      onChange={onChange}
    />
  );

  return onChange;
};

describe('AspectRatioFieldRender', () => {
  it('offers the original ratio, the presets and a custom ratio', () => {
    renderAspectRatio('auto');

    expect(
      screen
        .getAllByRole('radio')
        .map(radio => radio.getAttribute('aria-label'))
    ).toEqual([
      'Original',
      '1:1 square',
      '4:3 landscape',
      '3:2 landscape',
      '16:9 widescreen',
      '21:9 cinema',
      '3:4 portrait',
      '2:3 portrait',
      '9:16 vertical',
      'Custom',
    ]);
    expect(screen.getByRole('radio', { name: 'Original' })).toBeChecked();
    expect(
      screen.getByRole('radiogroup', { name: 'Aspect ratio' })
    ).toBeTruthy();
  });

  it('picks a preset', () => {
    const onChange = renderAspectRatio('auto');

    fireEvent.click(screen.getByRole('radio', { name: '16:9 widescreen' }));

    expect(onChange).toHaveBeenCalledWith('16:9');
  });

  it('edits a custom ratio as width and height', () => {
    const onChange = renderAspectRatio('5:4');

    expect(screen.getByRole('radio', { name: 'Custom' })).toBeChecked();

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ratio width' }), {
      target: { value: '7' },
    });

    expect(onChange).toHaveBeenLastCalledWith('7:4');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ratio height' }), {
      target: { value: '3' },
    });

    expect(onChange).toHaveBeenLastCalledWith('5:3');
  });

  it('starts a custom ratio from the current preset', () => {
    const onChange = renderAspectRatio('3:2');

    expect(screen.queryByRole('spinbutton')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Custom' }));

    expect(screen.getByRole('spinbutton', { name: 'Ratio width' })).toHaveValue(
      3
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ObjectFitFieldRender', () => {
  it('picks how the image fills the ratio', () => {
    const onChange = vi.fn();

    render(
      <ObjectFitFieldRender
        id="fit"
        name="fit"
        field={{ type: 'objectFit' }}
        value="cover"
        onChange={onChange}
      />
    );

    expect(
      screen
        .getAllByRole('radio')
        .map(radio => radio.getAttribute('aria-label'))
    ).toEqual([
      'Cover: fill the frame and crop',
      'Contain: show the whole image',
      'Fill: stretch to the frame',
      'None: original size, cropped',
      'Scale down: like contain, never enlarged',
    ]);
    expect(
      screen.getByRole('radio', { name: 'Cover: fill the frame and crop' })
    ).toBeChecked();

    fireEvent.click(
      screen.getByRole('radio', { name: 'Contain: show the whole image' })
    );

    expect(onChange).toHaveBeenCalledWith('contain');
  });
});

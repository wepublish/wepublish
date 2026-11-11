import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockGoodie,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderGoodiePickerProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { GoodiePicker } from './goodie-picker';

const goodie = mockGoodie({
  name: 'Tote bag',
  description: mockRichTextParagraph('Made from organic cotton'),
});
const otherGoodie = mockGoodie({ name: 'Coffee mug' });
const goodieWithoutImage = mockGoodie({ name: 'Sticker', image: null });
const soldOutGoodie = mockGoodie({ name: 'Umbrella', stock: 0 });

const renderGoodiePicker = (props: Partial<BuilderGoodiePickerProps> = {}) => {
  const onChange = vi.fn();

  const { container } = renderWithProviders(
    <GoodiePicker
      goodies={[goodie, otherGoodie, goodieWithoutImage]}
      onChange={onChange}
      {...props}
    />
  );

  return { onChange, container, user: userEvent.setup() };
};

const goodieRadio = (name: string) =>
  screen.getByRole('radio', {
    name: accessibleName => accessibleName.includes(name),
  });
const noGoodieRadio = () =>
  screen.getByRole('radio', { name: t('subscribe.goodie.none') });

describe('GoodiePicker', () => {
  it('offers every goodie and the option to take none, with nothing chosen yet', () => {
    renderGoodiePicker();

    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(noGoodieRadio()).toBeChecked();
    expect(goodieRadio(goodie.name)).not.toBeChecked();
  });

  it('reports the id of the picked goodie', async () => {
    const { user, onChange } = renderGoodiePicker();

    await user.click(goodieRadio(otherGoodie.name));

    expect(onChange).toHaveBeenCalledWith(otherGoodie.id);
  });

  it('reports null when the reader takes no goodie', async () => {
    const { user, onChange } = renderGoodiePicker({ value: goodie.id });

    await user.click(noGoodieRadio());

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('checks the goodie given as value', () => {
    renderGoodiePicker({ value: goodie.id });

    expect(goodieRadio(goodie.name)).toBeChecked();
    expect(noGoodieRadio()).not.toBeChecked();
  });

  it('shows the description of each goodie', () => {
    renderGoodiePicker({ goodies: [goodie] });

    expect(goodieRadio(goodie.name)).toHaveAccessibleName(
      expect.stringContaining('Made from organic cotton')
    );
  });

  it('shows an image only for goodies that have one', () => {
    const { container } = renderGoodiePicker({
      goodies: [goodie, goodieWithoutImage],
    });

    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('does not let the reader pick a sold out goodie', () => {
    renderGoodiePicker({ goodies: [goodie, soldOutGoodie] });

    expect(goodieRadio(soldOutGoodie.name)).toBeDisabled();
    expect(goodieRadio(goodie.name)).toBeEnabled();
  });

  it('disables every option when the picker is disabled', () => {
    renderGoodiePicker({ disabled: true });

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
  });
});

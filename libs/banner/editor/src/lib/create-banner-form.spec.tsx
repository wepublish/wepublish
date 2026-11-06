import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { CreateBannerDocument } from '@wepublish/editor/api';
import {
  formSectionOf,
  renderEditorForm,
} from '@wepublish/form/editor/testing';

import {
  createBannerMock,
  failingMutationMock,
  pickerMocks,
  wireFormat,
} from '../testing/banner-mocks';
import {
  actionsSection,
  BannerRoutes,
  controlOf,
  cta,
  delay,
  drawerClosed,
  embedUrl,
  hideForMinutes,
  html,
  inputOf,
  leavePage,
  pickPage,
  saveAndCloseButton,
  saveButton,
  checkboxOf,
  text,
  title,
} from '../testing/banner-queries';
import { CreateBannerForm } from './create-banner-form';

const requiredError = 'form.errors.required';

const renderCreate = (mocks = pickerMocks()) =>
  renderEditorForm(
    <BannerRoutes
      path="/banners/create"
      element={<CreateBannerForm />}
    />,
    { mocks, route: '/banners/create' }
  );

describe('CreateBannerForm', () => {
  it('is memoised by the React Compiler', () => {
    expect(CreateBannerForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('renders the header, its sections and every field with its default value', () => {
    renderCreate();

    expect(screen.getByText('banner.create.title')).toBeInTheDocument();
    expect(saveButton()).toHaveAttribute('type', 'submit');
    expect(saveAndCloseButton()).toHaveAttribute('type', 'submit');

    expect(screen.getAllByRole('region')).toEqual(
      [
        'banner.form.content',
        'banner.form.actions',
        'banner.form.customContent',
        'banner.form.timing',
        'banner.form.displayOptions',
      ].map(name => screen.getByRole('region', { name }))
    );

    expect(checkboxOf(/^banner\.form\.active/)).not.toBeChecked();
    expect(checkboxOf(/^banner\.form\.collapsible/)).toBeChecked();
    expect(checkboxOf(/^banner\.form\.showOnArticles/)).not.toBeChecked();

    expect(inputOf(delay)).toHaveValue(0);
    expect(inputOf(hideForMinutes)).toHaveValue(1440);

    expect(
      screen.getAllByRole('radio').map(radio => radio.getAttribute('value'))
    ).toEqual([
      'ALL',
      'LOGGED_IN',
      'LOGGED_OUT',
      'PAYWALL_BYPASSED',
      'SUBSCRIBED',
      'UNSUBSCRIBED',
    ]);
    expect(
      screen.getByRole('radio', { name: 'banner.form.loginStatus.ALL' })
    ).toBeChecked();
    expect(
      screen.getByRole('radio', {
        name: 'banner.form.loginStatus.PAYWALL_BYPASSED',
      })
    ).not.toBeChecked();

    expect(
      screen.getByPlaceholderText('navigation.panels.selectPage')
    ).toBeInTheDocument();

    expect(inputOf(title)).toHaveValue('');
    expect(inputOf(text)).toHaveValue('');
    expect(inputOf(cta)).toHaveValue('');
    expect(inputOf(html)).toHaveValue('');
    expect(inputOf(embedUrl)).toHaveValue('');
    expect(screen.getByText('banner.form.embedUrlHelp')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeEnabled();

    expect(within(actionsSection()).queryAllByRole('textbox')).toHaveLength(0);
    expect(
      within(actionsSection()).getByRole('button', {
        name: 'banner.actions.add',
      })
    ).toBeInTheDocument();
  });

  it('shows a back link to the banner list and both save buttons', () => {
    renderCreate();

    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/banners'
    );
    expect(screen.getByTestId('saveButton')).toBe(saveButton());
    expect(screen.getByTestId('saveAndCloseButton')).toBe(saveAndCloseButton());
  });

  it('names the actions group without a second actions heading', () => {
    renderCreate();

    expect(screen.getAllByText('banner.form.actions')).toHaveLength(1);
    expect(
      screen.getByRole('group', { name: 'banner.form.actions' })
    ).toBeInTheDocument();
  });

  it('renders its sections as regions', () => {
    renderCreate();

    const content = formSectionOf('banner.form.content');

    expect(content.getByText(title, { selector: 'label' })).toBeInTheDocument();
    expect(content.getByText(text, { selector: 'label' })).toBeInTheDocument();
    expect(content.getByText(cta, { selector: 'label' })).toBeInTheDocument();
    expect(
      content.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeInTheDocument();

    expect(
      formSectionOf('banner.form.actions').getByRole('button', {
        name: 'banner.actions.add',
      })
    ).toBeInTheDocument();

    const customContent = formSectionOf('banner.form.customContent');

    expect(
      customContent.getByText(html, { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      customContent.getByText(embedUrl, { selector: 'label' })
    ).toBeInTheDocument();

    const displayOptions = formSectionOf('banner.form.displayOptions');

    expect(
      displayOptions.getByRole('checkbox', { name: /^banner\.form\.active/ })
    ).toBeInTheDocument();
    expect(
      displayOptions.getByRole('radio', { name: 'banner.form.loginStatus.ALL' })
    ).toBeInTheDocument();
    expect(
      displayOptions.getByRole('checkbox', {
        name: /^banner\.form\.showOnArticles/,
      })
    ).toBeInTheDocument();
    expect(
      displayOptions.getByPlaceholderText('navigation.panels.selectPage')
    ).toBeInTheDocument();

    const timing = formSectionOf('banner.form.timing');

    expect(timing.getByText(delay, { selector: 'label' })).toBeInTheDocument();
    expect(
      timing.getByText(hideForMinutes, { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      timing.getByRole('checkbox', { name: /^banner\.form\.collapsible/ })
    ).toBeInTheDocument();
  });

  it('keeps the timing section in the main column, where its long labels fit', () => {
    renderCreate();

    const columnOf = (name: string) =>
      screen.getByRole('region', { name }).parentElement;

    expect(columnOf('banner.form.timing')).toBe(
      columnOf('banner.form.content')
    );
    expect(columnOf('banner.form.displayOptions')).not.toBe(
      columnOf('banner.form.content')
    );
  });

  it('shows the delay in seconds and the hiding duration in minutes', () => {
    renderCreate();

    expect(
      within(controlOf(delay)).getByText('form.units.seconds')
    ).toBeVisible();
    expect(inputOf(delay)).toHaveAccessibleDescription(
      expect.stringContaining('form.units.seconds')
    );
    expect(
      within(controlOf(hideForMinutes)).getByText('form.units.minutes')
    ).toBeVisible();
    expect(inputOf(hideForMinutes)).toHaveAccessibleDescription(
      expect.stringContaining('form.units.minutes')
    );
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user } = renderCreate();

    await user.type(inputOf(title), 'Jetzt abonnieren');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(inputOf(title)).toHaveValue('Jetzt abonnieren');

    await user.click(screen.getByRole('link', { name: 'back' }));
    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    expect(await screen.findByTestId('location')).toHaveTextContent(
      /^\/banners$/
    );
  });

  it('marks the required fields, including those with a default', () => {
    renderCreate();

    expect(
      screen.getByText('banner.form.title*', { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('banner.form.text*', { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('banner.form.delay*', { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('banner.form.hideForMinutes*', { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('banner.form.showForLoginStatus*', { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('banner.form.cta', { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('banner.form.html', { selector: 'label' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('banner.form.embedUrl', { selector: 'label' })
    ).toBeInTheDocument();
    expect(inputOf(title)).toBeRequired();
    expect(inputOf(delay)).toBeRequired();
    expect(inputOf(cta)).not.toBeRequired();
  });

  it('explains the fields that carry an info tooltip', () => {
    renderCreate();

    for (const info of [
      'banner.form.collapsibleInfo',
      'banner.form.delayInfo',
      'banner.form.showForLoginStatusInfo',
      'banner.form.showOnPagesInfo',
      'banner.form.ctaInfo',
      'banner.form.htmlInfo',
    ]) {
      expect(screen.getByRole('button', { name: info })).toBeInTheDocument();
    }
  });

  it('requires a title and a text and does not create the banner without them', async () => {
    const created = vi.fn();
    const { user } = renderCreate([
      ...pickerMocks(),
      createBannerMock(created),
    ]);

    await user.click(saveButton());

    await waitFor(() =>
      expect(screen.getAllByText(requiredError)).toHaveLength(2)
    );
    expect(controlOf(title)).toHaveTextContent(requiredError);
    expect(controlOf(text)).toHaveTextContent(requiredError);
    expect(created).not.toHaveBeenCalled();
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
  });

  it('shows the error of a required field as soon as it is left empty', async () => {
    const { user } = renderCreate();

    await user.click(inputOf(title));
    await user.tab();

    await waitFor(() =>
      expect(controlOf(title)).toHaveTextContent(requiredError)
    );
    expect(controlOf(text)).not.toHaveTextContent(requiredError);
  });

  it('creates a banner from the defaults and opens it for editing', async () => {
    const created = vi.fn();
    const { user } = renderCreate([
      ...pickerMocks(),
      createBannerMock(created, 'banner-new'),
    ]);

    await user.type(inputOf(title), 'Jetzt abonnieren');
    await user.type(inputOf(text), 'Unterstütze uns.');
    await user.click(saveButton());

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(wireFormat(created.mock.calls[0][0])).toStrictEqual({
      input: {
        title: 'Jetzt abonnieren',
        text: 'Unterstütze uns.',
        cta: '',
        html: '',
        embedUrl: '',
        active: false,
        collapsible: true,
        delay: 0,
        hideForMinutes: 1440,
        showForLoginStatus: 'ALL',
        showOnArticles: false,
        showOnPages: [],
        actions: [],
      },
    });
    expect(await screen.findByTestId('location')).toHaveTextContent(
      '/banners/edit/banner-new'
    );
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('saves with Enter and opens the banner for editing', async () => {
    const created = vi.fn();
    const { user } = renderCreate([
      ...pickerMocks(),
      createBannerMock(created, 'banner-new'),
    ]);

    await user.type(inputOf(text), 'Unterstütze uns.');
    await user.type(inputOf(title), 'Jetzt abonnieren{Enter}');

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(wireFormat(created.mock.calls[0][0]).input.title).toBe(
      'Jetzt abonnieren'
    );
    expect(await screen.findByTestId('location')).toHaveTextContent(
      '/banners/edit/banner-new'
    );
  });

  it('creates a banner with every field filled and returns to the list on save and close', async () => {
    const created = vi.fn();
    const { user } = renderCreate([
      ...pickerMocks(),
      createBannerMock(created),
    ]);

    await user.click(checkboxOf(/^banner\.form\.active/));
    await user.click(checkboxOf(/^banner\.form\.collapsible/));
    await user.clear(inputOf(delay));
    await user.type(inputOf(delay), '5');
    await user.clear(inputOf(hideForMinutes));
    await user.type(inputOf(hideForMinutes), '60');
    await user.click(
      screen.getByRole('radio', { name: 'banner.form.loginStatus.SUBSCRIBED' })
    );
    await user.click(checkboxOf(/^banner\.form\.showOnArticles/));

    await pickPage(user, 'Über uns');
    await pickPage(user, 'Startseite');
    await user.keyboard('{Escape}');

    await user.type(inputOf(title), 'Jetzt abonnieren');
    await user.type(inputOf(text), 'Unterstütze uns.');
    await user.type(inputOf(cta), 'Mach mit');

    await user.click(
      screen.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    );
    await user.click(await screen.findByRole('button', { name: /Portrait/ }));
    await drawerClosed();
    expect(screen.getByAltText('Portrait')).toBeInTheDocument();

    await user.type(inputOf(html), '<b>Hallo</b>');
    await user.type(inputOf(embedUrl), 'https://example.com/embed');

    await user.click(
      within(actionsSection()).getByRole('button', {
        name: 'banner.actions.add',
      })
    );

    const [label, url, style] =
      within(actionsSection()).getAllByRole('textbox');

    await user.type(label, 'Abo lösen');
    await user.type(url, 'https://example.com/abo');
    await user.type(style, 'outline');
    await user.click(within(actionsSection()).getByRole('combobox'));
    await user.click(
      await screen.findByRole('option', { name: 'banner.actions.role.PRIMARY' })
    );

    expect(created).not.toHaveBeenCalled();

    await user.click(saveAndCloseButton());

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(wireFormat(created.mock.calls[0][0])).toStrictEqual({
      input: {
        title: 'Jetzt abonnieren',
        text: 'Unterstütze uns.',
        cta: 'Mach mit',
        html: '<b>Hallo</b>',
        embedUrl: 'https://example.com/embed',
        active: true,
        collapsible: false,
        delay: 5,
        hideForMinutes: 60,
        showForLoginStatus: 'SUBSCRIBED',
        showOnArticles: true,
        showOnPages: [{ id: 'page-about' }, { id: 'page-home' }],
        imageId: 'image-portrait',
        actions: [
          {
            label: 'Abo lösen',
            url: 'https://example.com/abo',
            style: 'outline',
            role: 'PRIMARY',
          },
        ],
      },
    });
    expect(await screen.findByTestId('location')).toHaveTextContent(
      /^\/banners$/
    );
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('adds actions with the role «other» and removes them again', async () => {
    const created = vi.fn();
    const { user } = renderCreate([
      ...pickerMocks(),
      createBannerMock(created),
    ]);

    await user.click(
      within(actionsSection()).getByRole('button', {
        name: 'banner.actions.add',
      })
    );
    await user.click(
      within(actionsSection()).getByRole('button', {
        name: 'banner.actions.add',
      })
    );

    expect(within(actionsSection()).getAllByRole('textbox')).toHaveLength(6);

    for (const column of [
      /^banner\.form\.action\.label/,
      /^banner\.form\.action\.url/,
      /^banner\.form\.action\.style/,
      /^banner\.form\.action\.role/,
    ]) {
      expect(within(actionsSection()).getByText(column)).toBeInTheDocument();
    }

    expect(
      within(actionsSection()).getByRole('button', {
        name: 'banner.form.action.styleInfo',
      })
    ).toBeInTheDocument();
    expect(
      within(actionsSection()).getByRole('button', {
        name: 'banner.form.action.roleInfo',
      })
    ).toBeInTheDocument();
    expect(
      within(actionsSection()).getAllByRole('combobox')[0]
    ).toHaveTextContent('banner.actions.role.OTHER');

    await user.type(
      within(actionsSection()).getAllByRole('textbox')[3],
      'Später'
    );
    await user.click(
      within(actionsSection()).getAllByRole('button', {
        name: /^form\.array\.remove/,
      })[0]
    );

    expect(within(actionsSection()).getAllByRole('textbox')).toHaveLength(3);

    await user.type(inputOf(title), 'Titel');
    await user.type(inputOf(text), 'Text');
    await user.click(saveButton());

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(wireFormat(created.mock.calls[0][0]).input.actions).toStrictEqual([
      { label: 'Später', url: '', style: '', role: 'OTHER' },
    ]);
  });

  it('requires the delay once it is cleared', async () => {
    const created = vi.fn();
    const { user } = renderCreate([
      ...pickerMocks(),
      createBannerMock(created),
    ]);

    await user.clear(inputOf(delay));
    await user.type(inputOf(title), 'Titel');
    await user.type(inputOf(text), 'Text');
    await user.click(saveButton());

    await waitFor(() =>
      expect(controlOf(delay)).toHaveTextContent(requiredError)
    );
    expect(inputOf(delay)).toHaveValue(null);
    expect(created).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'delay', field: delay },
    { name: 'hiding duration', field: hideForMinutes },
  ])('rejects a negative $name', async ({ field }) => {
    const created = vi.fn();
    const { user } = renderCreate([
      ...pickerMocks(),
      createBannerMock(created),
    ]);

    fireEvent.change(inputOf(field), { target: { value: '-3' } });
    await user.type(inputOf(title), 'Titel');
    await user.type(inputOf(text), 'Text');
    await user.click(saveButton());

    await waitFor(() =>
      expect(controlOf(field)).toHaveTextContent(
        'banner.form.mustNotBeNegative'
      )
    );
    expect(created).not.toHaveBeenCalled();
  });

  it('rejects a duration that is not a whole number', async () => {
    const created = vi.fn();
    const { user } = renderCreate([
      ...pickerMocks(),
      createBannerMock(created),
    ]);

    fireEvent.change(inputOf(hideForMinutes), { target: { value: '1.5' } });
    await user.type(inputOf(title), 'Titel');
    await user.type(inputOf(text), 'Text');
    await user.click(saveButton());

    await waitFor(() =>
      expect(controlOf(hideForMinutes)).toHaveTextContent(
        'form.errors.invalid_type.int'
      )
    );
    expect(created).not.toHaveBeenCalled();
  });

  it('shows a toast and an inline alert and stays on the page when creating fails', async () => {
    const { user } = renderCreate([
      ...pickerMocks(),
      failingMutationMock(CreateBannerDocument, 'Server down'),
    ]);

    await user.type(inputOf(title), 'Titel');
    await user.type(inputOf(text), 'Text');
    await user.click(saveButton());

    expect(await screen.findByText('Server down')).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(screen.queryByText('toast.createdSuccess')).not.toBeInTheDocument();
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
    expect(inputOf(title)).toHaveValue('Titel');
  });

  it('warns before the page is left with unsaved changes', async () => {
    const { user, unmount } = renderCreate();

    expect(leavePage()).toBe(false);

    await user.type(inputOf(title), 'Titel');

    await waitFor(() => expect(leavePage()).toBe(true));

    unmount();
  });
});

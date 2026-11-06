import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  BannerActionRole,
  LoginStatus,
  UpdateBannerDocument,
} from '@wepublish/editor/api';
import { renderEditorForm } from '@wepublish/form/editor/testing';
import { Link } from 'react-router-dom';

import {
  bannerErrorMock,
  bannerMock,
  failingMutationMock,
  pickerMocks,
  storedAction,
  storedBanner,
  updateBannerMock,
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
  saveAndCloseButton,
  saveButton,
  checkboxOf,
  text,
  title,
} from '../testing/banner-queries';
import { EditBannerForm, EditBannerView } from './edit-banner-form';

const requiredError = 'form.errors.required';

const renderEdit = (mocks = [bannerMock(storedBanner), ...pickerMocks()]) =>
  renderEditorForm(
    <BannerRoutes
      path="/banners/edit/:id"
      element={<EditBannerForm />}
    />,
    { mocks, route: `/banners/edit/${storedBanner.id}` }
  );

const loaded = async () => {
  await waitFor(() => expect(inputOf(title)).toHaveValue(storedBanner.title));
};

const expectedUpdate = {
  input: {
    id: 'banner-1',
    title: 'Jetzt abonnieren',
    text: 'Unterstütze unabhängigen Journalismus.',
    cta: 'Mach mit',
    html: null,
    embedUrl: null,
    active: true,
    collapsible: false,
    delay: 5,
    hideForMinutes: 60,
    showForLoginStatus: 'UNSUBSCRIBED',
    showOnArticles: true,
    showOnPages: [{ id: 'page-home' }],
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
};

const submitAndCapture = async (
  user: UserEvent,
  button: HTMLElement,
  updated: ReturnType<typeof vi.fn>
) => {
  await user.click(button);
  await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));

  return wireFormat(updated.mock.calls[0][0]);
};

describe('EditBannerForm', () => {
  it('is memoised by the React Compiler', () => {
    expect(EditBannerView.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header and a progress indicator while the banner loads', async () => {
    renderEdit();

    expect(screen.getByText('banner.edit.title')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(title, { selector: 'label' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(saveAndCloseButton()).toBeDisabled();

    await loaded();

    expect(
      screen.queryByRole('progressbar', { name: 'form.loading' })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(5);
    expect(saveButton()).toBeEnabled();
    expect(saveAndCloseButton()).toBeEnabled();
  });

  it('shows the stored banner once it has loaded', async () => {
    renderEdit();

    await loaded();

    expect(screen.getByText('banner.edit.title')).toBeInTheDocument();
    expect(checkboxOf(/^banner\.form\.active/)).toBeChecked();
    expect(checkboxOf(/^banner\.form\.collapsible/)).not.toBeChecked();
    expect(checkboxOf(/^banner\.form\.showOnArticles/)).toBeChecked();
    expect(inputOf(delay)).toHaveValue(5);
    expect(inputOf(hideForMinutes)).toHaveValue(60);
    expect(
      screen.getByRole('radio', {
        name: 'banner.form.loginStatus.UNSUBSCRIBED',
      })
    ).toBeChecked();
    expect(inputOf(text)).toHaveValue(storedBanner.text);
    expect(inputOf(cta)).toHaveValue('Mach mit');
    expect(inputOf(html)).toHaveValue('');
    expect(inputOf(embedUrl)).toHaveValue('');
    expect(screen.getByAltText('Portrait')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Startseite' })
    ).toBeInTheDocument();

    const [label, url, style] =
      within(actionsSection()).getAllByRole('textbox');

    expect(label).toHaveValue('Abo lösen');
    expect(url).toHaveValue('https://example.com/abo');
    expect(style).toHaveValue('outline');
    expect(within(actionsSection()).getByRole('combobox')).toHaveTextContent(
      'banner.actions.role.PRIMARY'
    );
  });

  it('leaves for the banner list through the back link while nothing changed', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(await screen.findByTestId('location')).toHaveTextContent(
      /^\/banners$/
    );
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.type(inputOf(text), ' Danke.');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    expect(await screen.findByTestId('location')).toHaveTextContent(
      /^\/banners$/
    );
  });

  it('reports a banner that cannot be loaded in place of the fields and as a toast', async () => {
    renderEdit([
      bannerErrorMock(storedBanner.id, 'Banner not found'),
      ...pickerMocks(),
    ]);

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(screen.getAllByText('Banner not found')).toHaveLength(2);
    expect(
      screen.queryByText(title, { selector: 'label' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('banner.edit.title')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(saveAndCloseButton()).toBeDisabled();
  });

  it('loads the other banner when the route switches to it', async () => {
    const otherBanner = {
      ...storedBanner,
      id: 'banner-2',
      title: 'Jetzt spenden',
      text: 'Danke für deine Spende.',
      collapsible: true,
      delay: 10,
    };
    const { user } = renderEditorForm(
      <>
        <BannerRoutes
          path="/banners/edit/:id"
          element={<EditBannerForm />}
        />
        <Link to={`/banners/edit/${otherBanner.id}`}>other banner</Link>
      </>,
      {
        mocks: [
          bannerMock(storedBanner),
          bannerMock(otherBanner),
          ...pickerMocks(),
        ],
        route: `/banners/edit/${storedBanner.id}`,
      }
    );

    await loaded();
    await user.click(screen.getByRole('link', { name: 'other banner' }));

    await waitFor(() => expect(inputOf(title)).toHaveValue('Jetzt spenden'));
    expect(inputOf(text)).toHaveValue('Danke für deine Spende.');
    expect(inputOf(delay)).toHaveValue(10);
    expect(checkboxOf(/^banner\.form\.collapsible/)).toBeChecked();
  });

  it('saves the unchanged banner without ids and typenames and stays on the page', async () => {
    const updated = vi.fn();
    const { user } = renderEdit([
      bannerMock(storedBanner),
      ...pickerMocks(),
      updateBannerMock(updated),
    ]);

    await loaded();

    expect(await submitAndCapture(user, saveButton(), updated)).toStrictEqual(
      expectedUpdate
    );
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
    expect(screen.getByText('banner.edit.title')).toBeInTheDocument();
  });

  it('returns to the list after save and close', async () => {
    const updated = vi.fn();
    const { user } = renderEdit([
      bannerMock(storedBanner),
      ...pickerMocks(),
      updateBannerMock(updated),
    ]);

    await loaded();

    expect(
      await submitAndCapture(user, saveAndCloseButton(), updated)
    ).toStrictEqual(expectedUpdate);
    expect(await screen.findByTestId('location')).toHaveTextContent(
      /^\/banners$/
    );
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
  });

  it('saves the edited values', async () => {
    const updated = vi.fn();
    const { user } = renderEdit([
      bannerMock(storedBanner),
      ...pickerMocks(),
      updateBannerMock(updated),
    ]);

    await loaded();

    await user.clear(inputOf(title));
    await user.type(inputOf(title), 'Neu');
    await user.clear(inputOf(cta));
    await user.click(
      screen.getByRole('radio', { name: 'banner.form.loginStatus.LOGGED_OUT' })
    );
    await user.click(within(actionsSection()).getByRole('combobox'));
    await user.click(
      await screen.findByRole('option', { name: 'banner.actions.role.CANCEL' })
    );

    const variables = await submitAndCapture(user, saveButton(), updated);

    expect(variables).toStrictEqual({
      input: {
        ...expectedUpdate.input,
        title: 'Neu',
        cta: '',
        showForLoginStatus: 'LOGGED_OUT',
        actions: [
          {
            label: 'Abo lösen',
            url: 'https://example.com/abo',
            style: 'outline',
            role: 'CANCEL',
          },
        ],
      },
    });
  });

  it('removes the image and leaves the image id out', async () => {
    const updated = vi.fn();
    const { user } = renderEdit([
      bannerMock(storedBanner),
      ...pickerMocks(),
      updateBannerMock(updated),
    ]);

    await loaded();
    await user.click(
      screen.getByRole('button', { name: 'chooseEditImage.removeImage' })
    );

    expect(screen.queryByAltText('Portrait')).not.toBeInTheDocument();

    const { imageId, ...withoutImage } = expectedUpdate.input;

    expect(imageId).toBe('image-portrait');
    expect(await submitAndCapture(user, saveButton(), updated)).toStrictEqual({
      input: withoutImage,
    });
  });

  it('fills in defaults for a banner without login status, pages, image and actions', async () => {
    const updated = vi.fn();
    const bare = {
      ...storedBanner,
      showForLoginStatus: null as unknown as LoginStatus,
      showOnPages: null,
      image: null,
      actions: null,
    };
    const { user } = renderEdit([
      bannerMock(bare),
      ...pickerMocks(),
      updateBannerMock(updated),
    ]);

    await loaded();

    expect(
      screen.getByRole('radio', { name: 'banner.form.loginStatus.ALL' })
    ).toBeChecked();
    expect(within(actionsSection()).queryAllByRole('textbox')).toHaveLength(0);

    const { imageId, ...withoutImage } = expectedUpdate.input;

    expect(imageId).toBeDefined();
    expect(await submitAndCapture(user, saveButton(), updated)).toStrictEqual({
      input: {
        ...withoutImage,
        showForLoginStatus: 'ALL',
        showOnPages: [],
        actions: [],
      },
    });
  });

  it('requires the title', async () => {
    const updated = vi.fn();
    const { user } = renderEdit([
      bannerMock(storedBanner),
      ...pickerMocks(),
      updateBannerMock(updated),
    ]);

    await loaded();
    await user.clear(inputOf(title));
    await user.click(saveButton());

    await waitFor(() =>
      expect(controlOf(title)).toHaveTextContent(requiredError)
    );
    expect(updated).not.toHaveBeenCalled();
  });

  it('saves the image in the edit drawer without saving the banner', async () => {
    const updated = vi.fn();
    const imageUpdates = vi.fn();
    const { user } = renderEdit([
      bannerMock(storedBanner),
      ...pickerMocks(imageUpdates),
      updateBannerMock(updated),
    ]);

    await loaded();
    await user.click(
      screen.getByRole('button', { name: 'chooseEditImage.editImage' })
    );

    const drawer = await screen.findByRole('dialog');
    const save = await within(drawer).findByRole('button', { name: 'save' });

    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() =>
      expect(imageUpdates).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'image-portrait' })
      )
    );
    await drawerClosed();

    expect(screen.getByAltText('Portrait im Park')).toBeInTheDocument();
    expect(updated).not.toHaveBeenCalled();

    expect(await submitAndCapture(user, saveButton(), updated)).toStrictEqual(
      expectedUpdate
    );
  });

  it('keeps the role of an action as loaded', async () => {
    const updated = vi.fn();
    const cancelOnly = {
      ...storedBanner,
      actions: [{ ...storedAction, role: BannerActionRole.Cancel }],
    };
    const { user } = renderEdit([
      bannerMock(cancelOnly),
      ...pickerMocks(),
      updateBannerMock(updated),
    ]);

    await loaded();

    expect(within(actionsSection()).getByRole('combobox')).toHaveTextContent(
      'banner.actions.role.CANCEL'
    );
    expect(
      (await submitAndCapture(user, saveButton(), updated)).input.actions
    ).toStrictEqual([
      {
        label: 'Abo lösen',
        url: 'https://example.com/abo',
        style: 'outline',
        role: 'CANCEL',
      },
    ]);
  });

  it('shows a toast and an inline alert and keeps the changes when saving fails', async () => {
    const { user } = renderEdit([
      bannerMock(storedBanner),
      ...pickerMocks(),
      failingMutationMock(UpdateBannerDocument, 'Server down'),
    ]);

    await loaded();
    await user.clear(inputOf(title));
    await user.type(inputOf(title), 'Neu');
    await user.click(saveButton());

    expect(await screen.findByText('Server down')).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(screen.queryByText('toast.updatedSuccess')).not.toBeInTheDocument();
    expect(inputOf(title)).toHaveValue('Neu');
    await waitFor(() => expect(leavePage()).toBe(true));
  });

  it('warns about unsaved changes until they are saved', async () => {
    const updated = vi.fn();
    const { user, unmount } = renderEdit([
      bannerMock(storedBanner),
      ...pickerMocks(),
      updateBannerMock(updated),
    ]);

    await loaded();

    expect(leavePage()).toBe(false);

    await user.type(inputOf(text), ' Danke.');

    await waitFor(() => expect(leavePage()).toBe(true));

    await submitAndCapture(user, saveButton(), updated);

    await waitFor(() => expect(leavePage()).toBe(false));

    unmount();
  });
});

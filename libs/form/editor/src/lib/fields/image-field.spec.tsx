import { drawerClosed, renderEditorForm } from '../../testing';
import {
  imageFixture,
  imageListMock,
  imageMock,
  updateImageMock,
} from '../../testing/picker-mocks';
import { screen, waitFor, within } from '@testing-library/react';
import type { FormDefaultValues } from '@wepublish/form/core';
import {
  CanCreateImage,
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import { AuthContext, type AuthContextState } from '@wepublish/ui/editor';
import type { FormEvent } from 'react';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const portrait = imageFixture('image-portrait', 'Portrait');
const landscape = imageFixture('image-landscape', 'Landschaft');
const retitled = { ...portrait, title: 'Portrait im Park' };

const imageEditor: AuthContextState = {
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'image-editor',
        name: 'image-editor',
        description: null,
        systemRole: false,
        permissions: [
          CanCreateImage,
          CanGetImage,
          CanGetImages,
          CanDeleteImage,
        ].map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
};

const schema = z.object({
  image: formFields
    .image()
    .nullish()
    .meta({ label: 'event.form.image', helperText: 'event.form.imageHelp' }),
  logo: formFields.image().meta({ label: 'peerProfile.logo' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  onSubmitBubbled,
  defaultValues,
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  onSubmitBubbled?: (event: FormEvent) => void;
  defaultValues?: FormDefaultValues<typeof schema>;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema, { defaultValues });

  return (
    <AuthContext.Provider value={imageEditor}>
      <div onSubmit={onSubmitBubbled}>
        <editorForm.Form
          form={handle}
          onSubmit={onSubmit}
        >
          <Field
            name="image"
            disabled={disabled}
            readOnly={readOnly}
          />
          <Field name="logo" />
          <button type="submit">submit event</button>
        </editorForm.Form>
      </div>
    </AuthContext.Provider>
  );
}

const group = (name: RegExp) => screen.getByRole('group', { name });

const imageGroup = () => group(/^event\.form\.image/);
const logoGroup = () => group(/^peerProfile\.logo\*/);

const updates = vi.fn();

const mocks = () => [
  imageListMock([portrait, landscape]),
  imageMock(portrait),
  updateImageMock(retitled, updates),
];

beforeEach(() => {
  updates.mockClear();
});

describe('ImageField', () => {
  it('labels the image group, marks a required one and explains it', () => {
    renderEditorForm(<View />, { mocks: mocks() });

    expect(imageGroup()).not.toHaveAccessibleName(/\*/);
    expect(imageGroup()).toHaveAccessibleDescription('event.form.imageHelp');
    expect(logoGroup()).toBeInTheDocument();
    expect(
      within(imageGroup()).getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      })
    ).toBeEnabled();
  });

  it('chooses images in the drawer and submits the image objects', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(
      within(imageGroup()).getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      })
    );
    await user.click(await screen.findByRole('button', { name: /Portrait/ }));
    await drawerClosed();

    expect(within(imageGroup()).getByAltText('Portrait')).toBeInTheDocument();

    await user.click(
      within(logoGroup()).getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      })
    );
    await user.click(await screen.findByRole('button', { name: /Landschaft/ }));
    await drawerClosed();

    expect(within(logoGroup()).getByAltText('Landschaft')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'submit event' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          image: expect.objectContaining({
            id: 'image-portrait',
            largeURL: portrait.largeURL,
          }),
          logo: expect.objectContaining({ id: 'image-landscape' }),
        },
        expect.anything()
      )
    );
  });

  it('saves the image in the edit drawer without submitting the outer form', async () => {
    const onSubmit = vi.fn();
    const bubbled = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        onSubmitBubbled={event => bubbled(event.target)}
        defaultValues={{ image: portrait, logo: landscape }}
      />,
      { mocks: mocks() }
    );

    await user.click(
      within(imageGroup()).getByRole('button', {
        name: 'chooseEditImage.editImage',
      })
    );

    const drawer = await screen.findByRole('dialog');
    const save = await within(drawer).findByRole('button', { name: 'save' });

    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() =>
      expect(updates).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'image-portrait' })
      )
    );

    expect(bubbled).toHaveBeenCalledWith(drawer.querySelector('form'));

    await drawerClosed();

    expect(
      within(imageGroup()).getByAltText('Portrait im Park')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'submit event' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          image: expect.objectContaining({
            id: 'image-portrait',
            title: 'Portrait im Park',
          }),
          logo: expect.objectContaining({ id: 'image-landscape' }),
        },
        expect.anything()
      )
    );
  });

  it('submits null once an optional image is removed', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ image: portrait, logo: landscape }}
      />,
      { mocks: mocks() }
    );

    await user.click(
      within(imageGroup()).getByRole('button', {
        name: 'chooseEditImage.removeImage',
      })
    );

    expect(
      within(imageGroup()).queryByAltText('Portrait')
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'submit event' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          image: null,
          logo: expect.objectContaining({ id: 'image-landscape' }),
        },
        expect.anything()
      )
    );
  });

  it('shows the required error once a required image is removed', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ logo: landscape }}
      />,
      { mocks: mocks() }
    );

    await user.click(
      within(logoGroup()).getByRole('button', {
        name: 'chooseEditImage.removeImage',
      })
    );

    await waitFor(() =>
      expect(logoGroup()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(screen.getByText('form.errors.required')).toHaveClass('Mui-error');
  });

  it('shows the required error of an empty required image on submit', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(screen.getByRole('button', { name: 'submit event' }));

    await waitFor(() =>
      expect(logoGroup()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(screen.getByText('form.errors.required')).toHaveClass('Mui-error');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('offers no actions while disabled or read only', () => {
    const { unmount } = renderEditorForm(<View disabled />, { mocks: mocks() });

    expect(
      within(imageGroup()).getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      })
    ).toBeDisabled();

    unmount();

    renderEditorForm(
      <View
        readOnly
        defaultValues={{ image: portrait }}
      />,
      { mocks: mocks() }
    );

    expect(within(imageGroup()).getByAltText('Portrait')).toBeInTheDocument();
    expect(within(imageGroup()).queryByRole('button')).not.toBeInTheDocument();
  });
});

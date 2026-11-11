import { useMutation } from '@apollo/client/react';
import {
  CreateConsentDocument,
  SettingName,
  type FullConsentFragment,
} from '@wepublish/editor/api';
import { setFieldError, type TopLevelKey } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { entityProps } from '../fields/entity-select-field';
import { formFields } from '../form-fields';
import { formView } from './form-view';
import {
  useCreateForm,
  useEditForm,
  useSingletonForm,
} from './use-form-controller';

const consentSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  defaultValue: z.boolean().default(true),
});

const consentView = formView(consentSchema, {
  sections: [{ fields: ['name', 'slug', 'defaultValue'] }],
});

const pickSchema = z.object({
  consent: formFields.entity<FullConsentFragment>(),
  value: z.boolean(),
});

const pickView = formView(pickSchema, {
  sections: [{ fields: ['consent', 'value'] }],
});

const settingsSchema = z.object({
  [SettingName.AllowGuestCommenting]: z.boolean(),
  [SettingName.SessionTtlDays]: z.int().min(1),
});

const settingsView = formView(settingsSchema, {
  sections: [
    { fields: [SettingName.AllowGuestCommenting, SettingName.SessionTtlDays] },
  ],
});

declare const consents: FullConsentFragment[];
declare const storedConsent: FullConsentFragment;

describe('useCreateForm', () => {
  it('needs the hook to pass the props of an entity field', () => {
    // @ts-expect-error the entity picker needs its options
    useCreateForm(pickView, { title: 'demo.title', save: async () => 'id' });
    useCreateForm(pickView, {
      title: 'demo.title',
      save: async () => 'id',
      fields: {
        consent: {
          props: entityProps({
            options: consents,
            getOptionLabel: consent => consent.name,
          }),
        },
      },
    });
  });

  it('returns the new id from save', () => {
    useCreateForm(consentView, {
      title: 'demo.title',
      save: async values => {
        expectTypeOf(values).toEqualTypeOf<{
          name: string;
          slug: string;
          defaultValue: boolean;
        }>();

        return 'id';
      },
    });
    useCreateForm(consentView, {
      title: 'demo.title',
      // @ts-expect-error a create save resolves to the new id
      save: async () => 1,
    });
  });

  it('keeps the excess-property check on mutation variables', () => {
    const [createConsent] = useMutation(CreateConsentDocument);

    useCreateForm(consentView, {
      title: 'demo.title',
      save: async values => {
        await createConsent({ variables: values });
        // @ts-expect-error createConsent takes no main flag
        await createConsent({ variables: { ...values, main: true } });

        return undefined;
      },
    });
  });
});

describe('useEditForm', () => {
  it('loads a fragment with extra keys', () => {
    useEditForm(consentView, {
      title: 'demo.title',
      load: async () => storedConsent,
      save: async () => undefined,
    });
  });

  it('rejects a loader of the wrong shape', () => {
    useEditForm(consentView, {
      title: 'demo.title',
      // @ts-expect-error name is a string
      load: async () => ({ name: 1 }),
      save: async () => undefined,
    });
  });
});

describe('useSingletonForm', () => {
  it('names the changed keys of enum-keyed schemas', () => {
    useSingletonForm(settingsView, {
      title: 'demo.title',
      load: async () => ({}),
      save: async (values, { changedKeys, form }) => {
        expectTypeOf(changedKeys).toEqualTypeOf<
          readonly TopLevelKey<typeof settingsSchema>[]
        >();

        for (const name of changedKeys) {
          setFieldError(form, name, 'demo.invalid', { value: values[name] });
        }
      },
    });
  });
});

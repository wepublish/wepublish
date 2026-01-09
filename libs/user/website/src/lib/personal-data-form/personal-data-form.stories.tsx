import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';
import { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { User } from '@wepublish/website/api';
import { ComponentProps } from 'react';
import z from 'zod';
import { PersonalDataForm } from './personal-data-form';
import { mockImage } from '@wepublish/storybook/mocks';

const mockUser = {
  id: '1234-1234',
  firstName: 'Kamil',
  name: 'Wasyl',
  email: 'some-example@mail.com',
  password: 'password123',
  flair: 'Financial Advisor & CEO',
  address: {
    streetAddress: 'Cool Street',
    streetAddressNumber: '1234',
    zipCode: '12345',
    city: 'Surfers Paradise',
    country: 'Australia',
  },
  image: mockImage(),
  paymentProviderCustomers: [],
  properties: [],
  permissions: [],
} as User;

const Render = () => {
  const [args, updateArgs] = useArgs();
  const props = args as ComponentProps<typeof PersonalDataForm>;

  return (
    <PersonalDataForm
      {...props}
      user={mockUser}
      onUpdate={async data => {
        args.onUpdate(data);
        updateArgs({
          update: {
            loading: true,
          },
        });
      }}
    />
  );
};

export default {
  title: 'Components/Personal Data Form',
  component: PersonalDataForm,
  render: Render,
} as Meta;

const fillFirstName: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Vorname', {
    selector: 'input',
  });

  await step('Enter firstname', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'Foo');
  });
};

const fillFlair: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Funktion / Beruf', {
    selector: 'input',
  });

  await step('Enter preferred name', async () => {
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, 'Wordpress Ninja & CSS Shaolin');
  });
};

const fillName: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Nachname', {
    selector: 'input',
  });

  await step('Enter name', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'Bar');
  });
};

const fillEmail: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Email (nicht bearbeitbar)', {
    selector: 'input',
  });

  await step('Enter email', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'foobar@email.com');
  });
};

const fillPassword: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Passwort', {
    selector: 'input',
  });

  await step('Enter password', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '12345678');
  });
};

const fillRepeatPassword: StoryObj['play'] = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Passwort wiederholen', {
    selector: 'input',
  });

  await step('Enter password', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '12345678');
  });
};

const fillStreetName: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const streetInput = canvas.getByLabelText('Strasse', {
    selector: 'input',
  });

  const numberInput = canvas.getByLabelText('Hausnummer', {
    selector: 'input',
  });

  await step('Enter streetName', async () => {
    await userEvent.click(streetInput);
    await userEvent.type(streetInput, 'Musterstrasse');

    await userEvent.click(numberInput);
    await userEvent.type(numberInput, '1');
  });
};

const fillZip: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('PLZ', {
    selector: 'input',
  });

  await step('Enter zip', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '8047');
  });
};

const fillCity: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Ort / Stadt', {
    selector: 'input',
  });

  await step('Enter city', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'Zürich');
  });
};

const fillCountry: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Land', {
    selector: 'input',
  });

  await step('Enter country', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'Schweiz{enter}');
  });
};

const clickUpdate: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const submitButton = canvas.getByText('Speichern');

  await step('Submit form', async () => {
    await userEvent.click(submitButton);
  });
};

const fillRequired: StoryObj['play'] = async ctx => {
  const { step } = ctx;

  await step('Enter required credentials', async () => {
    await fillName(ctx);
    await fillEmail(ctx);
  });
};

const fillAddress: StoryObj['play'] = async ctx => {
  const { step } = ctx;

  await step('Enter address', async () => {
    await fillStreetName(ctx);
    await fillZip(ctx);
    await fillCity(ctx);
    await fillCountry(ctx);
  });
};

const fillBirthday: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Geburtstag', {
    selector: 'input',
  });

  await step('Enter birthday', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '09081994');
  });
};

// const deleteImage: StoryObj['play'] = async ({canvasElement, step}) => {
//   const canvas = within(canvasElement)
//   const button = canvas.getByTitle('Bild löschen')

//   await step('Click delete image', async () => {
//     await userEvent.click(button)
//   })
// }

export const Default: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
  },
};

export const WithMediaEmail: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    mediaEmail: 'some@email.com',
  },
};

export const Filled: StoryObj = {
  ...Default,
  play: async ctx => {
    await fillRequired(ctx);
    await fillFirstName(ctx);
    await fillPassword(ctx);
    await fillRepeatPassword(ctx);
    await fillAddress(ctx);
    await clickUpdate(ctx);
  },
};

export const Invalid: StoryObj = {
  ...Default,
  play: async ctx => {
    await clickUpdate(ctx);
  },
};

export const OnlyFirstName: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['firstName'],
  },
};

export const OnlyFirstNameFilled: StoryObj = {
  ...OnlyFirstName,
  play: async ctx => {
    await fillRequired(ctx);
    await fillFirstName(ctx);
    await clickUpdate(ctx);
  },
};

export const OnlyFlair: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['flair'],
  },
};

export const OnlyFlairFilled: StoryObj = {
  ...OnlyFlair,
  play: async ctx => {
    await fillRequired(ctx);
    await fillFlair(ctx);
    await clickUpdate(ctx);
  },
};

export const OnlyBirthday: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    fields: ['birthday'],
  },
};

export const OnlyBirthdayFilled: StoryObj = {
  ...OnlyBirthday,
  play: async ctx => {
    await fillRequired(ctx);
    await fillBirthday(ctx);
    await clickUpdate(ctx);
  },
};

export const OnlyAddress: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['address'],
  },
};

export const OnlyAddressFilled: StoryObj = {
  ...OnlyAddress,
  play: async ctx => {
    await fillRequired(ctx);
    await fillAddress(ctx);
    await clickUpdate(ctx);
  },
};

export const OnlyPassword: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['password'],
  },
};

export const OnlyPasswordFilled: StoryObj = {
  ...OnlyPassword,
  play: async ctx => {
    await fillRequired(ctx);
    await fillPassword(ctx);
    await fillRepeatPassword(ctx);
    await clickUpdate(ctx);
  },
};

export const OnlyPasswordInvalid: StoryObj = {
  ...OnlyPassword,
  play: async ctx => {
    await clickUpdate(ctx);
  },
};

export const OnlyRequired: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: [],
  },
};

export const OnlyRequiredFilled: StoryObj = {
  ...OnlyRequired,
  play: async ctx => {
    await fillRequired(ctx);
    await clickUpdate(ctx);
  },
};

const customSchema = z.object({
  password: z.string().min(16),
});

export const WithCustomValidation: StoryObj = {
  ...OnlyPasswordInvalid,
  args: {
    ...OnlyPasswordInvalid.args,
    schema: customSchema,
  },
};

export const WithUpdateError: StoryObj = {
  args: {
    onUpdate: (...args: unknown[]) => {
      action('onUpdate')(args);

      throw new ApolloError({
        errorMessage: 'Foobar',
      });
    },
  },
  play: Filled.play,
};

export const WithUpdateLoading: StoryObj = {
  args: {
    onUpdate: (...args: unknown[]) => {
      action('onUpdate')(args);

      return new Promise(() => {
        // never resolve
      });
    },
  },
  play: Filled.play,
};

// export const WithImageActionError: StoryObj = {
//   args: {
//     onImageUpload: (...args: unknown[]) => {
//       action('onImageUpload')(args)

//       throw new ApolloError({
//         errorMessage: 'Foobar'
//       })
//     }
//   },
//   play: deleteImage
// }

// export const WithImageActionLoading: StoryObj = {
//   args: {
//     onImageUpload: (...args: unknown[]) => {
//       action('onImageUpload')(args)

//       return new Promise(() => {
//         // never resolve
//       })
//     }
//   },
//   play: deleteImage
// }

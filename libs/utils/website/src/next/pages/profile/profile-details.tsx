import styled from '@emotion/styled';
import {
  UserAddressWrapper,
  UserFormWrapper,
} from '@wepublish/authentication/website';
import { ContentWrapper } from '@wepublish/content/website';
import {
  HISTORY_COLUMNS_SHOWN,
  SectionBox,
} from '@wepublish/membership/website';
import {
  PasswordFormContainer,
  PersonalDataFormContainer,
  PersonalDataInputForm,
  TotpSetupContainer,
} from '@wepublish/user/website';
import {
  BuilderPersonalDataFormFields,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useWebsiteFeature } from '../../../lib/use-website-feature';

export const ProfileWrapper = styled(ContentWrapper)`
  gap: ${({ theme }) => theme.spacing(2)};
`;

// the full width, like the subscription history above
export const ProfileDetailsWrapper = styled('div')`
  container-type: inline-size;
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};

  // closer to the subscription history above while it is a table
  ${HISTORY_COLUMNS_SHOWN} {
    & > h1 {
      margin-top: ${({ theme }) => theme.spacing(-3)};
    }
  }
`;

/**
 * Personal data and security side by side wherever the subscription history
 * above is a table; stacked together with it.
 */
export const ProfileDetailsColumns = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  align-items: start;

  ${HISTORY_COLUMNS_SHOWN} {
    grid-template-columns: 1fr 1fr;
  }
`;

/**
 * The personal data form, as wide as its box and laid out by the box's width
 * instead of the window's: the box is half as wide where it sits beside the
 * security section.
 */
export const ProfilePersonalData = styled('div')`
  container-type: inline-size;
  justify-self: stretch;

  ${PersonalDataInputForm}, ${UserFormWrapper} {
    grid-template-columns: 1fr;
  }

  ${UserAddressWrapper} {
    grid-column: 1 / -1;
    // zip code a third, the city the rest
    grid-template-columns: 1fr 2fr;

    // the country on its own line
    & > :last-child {
      grid-column: 1 / -1;
    }
  }

  @container (min-width: 360px) {
    ${PersonalDataInputForm}, ${UserFormWrapper} {
      grid-template-columns: 1fr 1fr;
    }
  }

  @container (min-width: 560px) {
    ${UserAddressWrapper} {
      // the zip code needs less room than city and country
      grid-template-columns: 1fr 2fr 2fr;

      & > :last-child {
        grid-column: auto;
      }
    }
  }
`;

/** A part of the security section: password, two-factor authentication. */
export const ProfileSecurityPart = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-self: stretch;

  & > h3,
  & h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.body1.fontSize};
    font-weight: 600;
  }
`;

/** As wide as the password form above, without the component's cap. */
const ProfileTotpSetup = styled(TotpSetupContainer)`
  max-width: none;
`;

const DEFAULT_FIELDS: BuilderPersonalDataFormFields[] = [
  'firstName',
  'flair',
  'address',
  'password',
  'image',
];

export type ProfileDetailsProps = Pick<
  ComponentProps<typeof PersonalDataFormContainer>,
  'fields' | 'schema'
> & { className?: string };

/**
 * The reader's personal data and security. With the subscription history, as
 * wide as its table: the personal data and, in a section of their own, the
 * password and two-factor authentication.
 */
export function ProfileDetails({
  className,
  fields,
  schema,
}: ProfileDetailsProps) {
  const {
    elements: { H4, H6 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const split = useWebsiteFeature('profile-subscription-history');

  if (!split) {
    return (
      <ProfileWrapper className={className}>
        <H4 component={'h1'}>{t('navbar.profile')}</H4>

        <PersonalDataFormContainer
          fields={fields}
          schema={schema}
        />

        <TotpSetupContainer />
      </ProfileWrapper>
    );
  }

  const allFields = fields ?? DEFAULT_FIELDS;
  const withPassword = allFields.includes('password');

  return (
    <ProfileDetailsWrapper className={className}>
      <H4 component={'h1'}>{t('navbar.profile')}</H4>

      <ProfileDetailsColumns>
        <SectionBox title={t('user.sections.personalData')}>
          <ProfilePersonalData>
            <PersonalDataFormContainer
              fields={allFields.filter(field => field !== 'password')}
              schema={schema}
            />
          </ProfilePersonalData>
        </SectionBox>

        <SectionBox title={t('user.sections.security')}>
          {withPassword && (
            <ProfileSecurityPart>
              <H6 component="h3">{t('user.changePassword')}</H6>
              <PasswordFormContainer schema={schema} />
            </ProfileSecurityPart>
          )}

          <ProfileSecurityPart>
            <ProfileTotpSetup titleComponent="h3" />
          </ProfileSecurityPart>
        </SectionBox>
      </ProfileDetailsColumns>
    </ProfileDetailsWrapper>
  );
}

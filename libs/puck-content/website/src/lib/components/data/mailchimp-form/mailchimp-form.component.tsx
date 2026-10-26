import { useTheme } from '@mui/material';
import { PuckComponent } from '@puckeditor/core';
import { MailchimpFormOptionsLayout } from '@wepublish/website/api';
import {
  BuilderMailchimpFormBlockProps,
  MailchimpFormBlock,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

import { ColorValue, resolveColor } from '@wepublish/puck-content/editor';

export type MailchimpFormInputConfig = {
  inputType: string;
  name: string;
  label: string;
  description: string;
  required: boolean;
  urlParam: string;
  defaultValue: string;
  value: string;
  optionsLayout: MailchimpFormOptionsLayout;
  options: Array<{ id: string; name: string; description: string }>;
};

export type MailchimpFormStepConfig = {
  skipIfFieldsFilled: string[];
  skipIfInterestsFilled: string[];
  showIfInterestsFilled: string[];
  inputs: MailchimpFormInputConfig[];
};

export type MailchimpFormSuccessOptionConfig = {
  label: string;
  background: string;
  url: string;
  mergeFieldName: string;
  mergeFieldValue: string;
};

export type MailchimpFormConfigProps = Omit<
  BuilderMailchimpFormBlockProps,
  'buttonColor' | 'buttonFontColor' | 'steps' | 'successPage'
> & {
  buttonColor?: ColorValue;
  buttonFontColor?: ColorValue;
  steps: MailchimpFormStepConfig[];
  successPage?: {
    description: string;
    options: MailchimpFormSuccessOptionConfig[];
  };
};

export const MailchimpFormRender: PuckComponent<MailchimpFormConfigProps> = ({
  buttonColor,
  buttonFontColor,
  steps,
  successPage,
  ...props
}) => {
  const theme = useTheme();

  const blockSteps = useMemo(
    () =>
      steps.map(step => ({
        ...step,
        __typename: 'MailchimpFormStep' as const,
        inputs: step.inputs.map(input => ({
          ...input,
          __typename: 'MailchimpFormFieldConfig' as const,
          options: input.options.map(option => ({
            ...option,
            __typename: 'MailchimpFormInterestOption' as const,
            image: null,
          })),
        })),
      })),
    [steps]
  );

  const blockSuccessPage = useMemo(
    () =>
      successPage && {
        __typename: 'MailchimpFormSuccessPage' as const,
        description: successPage.description,
        options: successPage.options.map(option => ({
          ...option,
          __typename: 'MailchimpFormSuccessOption' as const,
        })),
      },
    [successPage]
  );

  return (
    <MailchimpFormBlock
      {...props}
      steps={blockSteps}
      successPage={blockSuccessPage}
      buttonColor={resolveColor(theme, buttonColor)}
      buttonFontColor={resolveColor(theme, buttonFontColor)}
    />
  );
};

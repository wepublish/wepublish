import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { createTheme } from '@mui/material';
import {
  UpdateWebsiteSettingsDocument,
  WebsiteRemoteFontInput,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  FormPage,
  useQueryLoader,
  useSingletonForm,
} from '@wepublish/form/editor';
import { minimalTheme } from '@wepublish/ui';
import { useState } from 'react';

import { normalizeTheme } from './theme/theme.schema';
import { mergeFonts } from './theme/theme-transfer';
import { toThemeVariables } from './website-theme.schema';
import { websiteThemeView } from './website-theme.view';
import { WebsiteThemeTransfer } from './website-theme-transfer';

const FullWidth = styled.div`
  display: contents;
  --wep-form-max-width: none;
`;

const fontInputs = (
  fonts: readonly WebsiteRemoteFontInput[]
): WebsiteRemoteFontInput[] =>
  fonts.map(({ name, weight, style }) => ({ name, weight, style }));

export const WebsiteTheme = () => {
  const [websiteFonts, setWebsiteFonts] = useState<WebsiteRemoteFontInput[]>(
    []
  );
  const loadSettings = useQueryLoader(
    WebsiteSettingsDocument,
    {},
    data => data.websiteSettings
  );
  const [updateWebsiteSettings] = useMutation(UpdateWebsiteSettingsDocument);

  const load = async () => {
    const { theme, fonts } = await loadSettings();

    setWebsiteFonts(fontInputs(fonts));

    return {
      ...normalizeTheme(createTheme(minimalTheme, theme ?? {})),
      importedFonts: [],
    };
  };

  const websiteTheme = useSingletonForm(websiteThemeView, {
    title: 'websiteSettings.theme.title',
    closePath: '/settings/website',
    headerActions: <WebsiteThemeTransfer websiteFonts={websiteFonts} />,
    load,
    save: async values => {
      const fonts = mergeFonts(websiteFonts, values.importedFonts);

      await updateWebsiteSettings({
        variables: { theme: toThemeVariables(values), fonts },
      });

      if (fonts) {
        setWebsiteFonts(fonts);
      }
    },
  });

  return (
    <FullWidth>
      <FormPage controller={websiteTheme} />
    </FullWidth>
  );
};

import { useQuery } from '@apollo/client/react';
import { SettingName, SettingsListDocument } from '@wepublish/editor/api';
import { ArticleMetadata, useSeededState } from '@wepublish/ui/editor';
import { Dispatch, SetStateAction } from 'react';

export function useNewArticleDefaults(
  setMetadata: Dispatch<SetStateAction<ArticleMetadata>>,
  { skip }: { skip?: boolean } = {}
) {
  const { data } = useQuery(SettingsListDocument, { skip });

  useSeededState(data, settings => {
    const setting = (name: SettingName) =>
      settings.settings.find(candidate => candidate.name === name)?.value;

    setMetadata(meta => ({
      ...meta,
      shared: meta.shared ?? !!setting(SettingName.NewArticlePeering),
      paywall:
        meta.paywall ??
        (setting(SettingName.NewArticlePaywall) as string | null | undefined),
    }));
  });
}

import { useQuery } from '@apollo/client/react';
import { SettingName, SettingsListDocument } from '@wepublish/editor/api';
import { ArticleMetadata } from '@wepublish/ui/editor';
import { Dispatch, SetStateAction, useEffect } from 'react';

export function useNewArticleDefaults(
  setMetadata: Dispatch<SetStateAction<ArticleMetadata>>,
  { skip }: { skip?: boolean } = {}
) {
  const { data } = useQuery(SettingsListDocument, { skip });

  useEffect(() => {
    if (data) {
      setMetadata(meta => ({
        ...meta,
        shared:
          meta.shared ??
          !!data.settings.find(
            setting => setting.name === SettingName.NewArticlePeering
          )?.value,
        paywall:
          meta.paywall ??
          (data.settings.find(
            setting => setting.name === SettingName.NewArticlePaywall
          )?.value as string | null | undefined),
      }));
    }
  }, [data, setMetadata]);
}

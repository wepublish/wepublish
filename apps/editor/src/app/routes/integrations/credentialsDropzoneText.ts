export const credentialsDropzoneText = (
  {
    dragging,
    newFile,
    stored,
  }: { dragging: boolean; newFile: boolean; stored: boolean },
  t: (key: string) => string
) =>
  dragging ? t('integrations.analyticsSettings.dropCredentialsFile')
  : newFile ? t('integrations.analyticsSettings.credentialsReadyToBeSaved')
  : stored ? t('integrations.analyticsSettings.credentialsStored')
  : t('integrations.analyticsSettings.dragCredentialsFileHere');

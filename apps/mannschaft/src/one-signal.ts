type OneSignalModule = typeof import('react-onesignal');
type OneSignalSdk = OneSignalModule['default'];

export const initOneSignal = async (
  load: () => Promise<OneSignalModule> = () => import('react-onesignal')
) => {
  try {
    const { default: OneSignal } = await load();

    if (!OneSignal.Notifications.isPushSupported()) {
      return;
    }

    await OneSignal.init({
      appId: '71c06630-2d7c-487d-b261-e718bb8ef25f',
      notifyButton: { enable: true } as NonNullable<
        Parameters<OneSignalSdk['init']>[0]['notifyButton']
      >,
      allowLocalhostAsSecureOrigin: true,
    });
  } catch {
    return;
  }
};

import { GateMode } from '@prisma/client';
import { GateWithActions } from '@wepublish/gate/api';
import { BannerActionRole } from './banner-action.model';
import { Banner } from './banner.model';

export const toBanner = (
  gate: GateWithActions | null | undefined
): Banner | null => {
  if (gate?.mode !== GateMode.BANNER) {
    return null;
  }

  return {
    id: gate.id,
    title: gate.title ?? '',
    text: gate.text ?? '',
    cta: gate.cta,
    html: gate.html,
    embedUrl: gate.embedUrl,
    active: gate.active,
    collapsible: gate.collapsible,
    delay: gate.delay,
    hideForMinutes: gate.hideForMinutes,
    showOnArticles: gate.showOnArticles,
    imageId: gate.imageId,
    showForLoginStatus: gate.audience,
    actions: gate.actions.map(({ id, label, url, style, role }) => ({
      id,
      label,
      url,
      style,
      role: role as BannerActionRole,
    })),
  };
};

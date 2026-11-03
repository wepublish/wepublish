import { Config } from '@puckeditor/core';

type Translate = (key: string, options: { defaultValue: string }) => string;

export const withTranslatedLabels = <C extends Config>(
  config: C,
  t: Translate
): C => ({
  ...config,
  components: Object.fromEntries(
    Object.entries(config.components).map(([type, component]) => [
      type,
      component.nameKey ?
        {
          ...component,
          label: t(component.nameKey, {
            defaultValue: component.label ?? type,
          }),
        }
      : component,
    ])
  ),
});

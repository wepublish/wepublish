import { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Plainer messages than zod's generic ones for a form: an empty or too short
 * field, and no option picked (instead of listing all options). Everything
 * else is left to the global error map.
 */
export const formErrorMap =
  (t: TFunction): z.ZodErrorMap =>
  (issue, ctx) => {
    if (
      issue.code === z.ZodIssueCode.too_small &&
      issue.type === 'string' &&
      issue.inclusive
    ) {
      return {
        message: t('user.form.errors.minLength', {
          minimum: Number(issue.minimum),
        }),
      };
    }

    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { message: t('user.form.errors.chooseOption') };
    }

    return { message: ctx.defaultError };
  };

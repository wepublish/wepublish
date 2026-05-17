import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionEvent, UserEvent } from '@prisma/client';

/**
 * Where a placeholder originates. The frontend uses this to group placeholders
 * by event and to mark which ones are always available vs event-specific.
 */
export enum PlaceholderScope {
  Always = 'always',
  SubscriptionEvent = 'subscriptionEvent',
  UserEvent = 'userEvent',
}

export interface MailPlaceholder {
  /** the flat key as it appears in the template (e.g. `user_email`) */
  key: string;
  /** a human-readable description (translation key in editor) */
  description: string;
  /** the scope this placeholder is bound to */
  scope: PlaceholderScope;
  /** the specific event identifier within the scope (null for Always) */
  event: SubscriptionEvent | UserEvent | null;
}

/**
 * Fields of `User` that are stripped from the template data before sending
 * (see MailController.buildData in libs/mail/api/src/lib/mail.controller.ts).
 */
const SENSITIVE_USER_FIELDS = new Set([
  'password',
  'roleIDs',
  'totpSecret',
  'totpEnabled',
  'totpExempt',
]);

/**
 * Prisma scalar / enum field types that are safe to expose as flat
 * placeholders (everything else — relations, JSON, lists — is dropped).
 */
const SCALAR_KINDS = new Set(['scalar', 'enum']);

/**
 * Describes what each call site passes as `optionalData` to MailController.
 * Each event lists, by key, the Prisma model whose scalar fields will end up
 * flattened under `optional_<key>_*`. Keep this in sync with the call sites
 * (periodic-job.service.ts, user.service.ts, legacy/member-context.ts).
 */
const EVENT_OPTIONAL_SHAPE: {
  subscription: Record<SubscriptionEvent, Record<string, PlaceholderShape>>;
  user: Record<UserEvent, Record<string, PlaceholderShape>>;
} = {
  subscription: {
    [SubscriptionEvent.SUBSCRIBE]: {
      subscription: { kind: 'model', model: 'Subscription' },
    },
    [SubscriptionEvent.CONFIRM_SUBSCRIPTION]: {
      subscription: { kind: 'model', model: 'Subscription' },
    },
    [SubscriptionEvent.INVOICE_CREATION]: {
      subscription: { kind: 'model', model: 'Subscription' },
      invoice: { kind: 'model', model: 'Invoice' },
    },
    [SubscriptionEvent.RENEWAL_SUCCESS]: {
      subscription: { kind: 'model', model: 'Subscription' },
      invoice: { kind: 'model', model: 'Invoice' },
      errorCode: { kind: 'scalar' },
    },
    [SubscriptionEvent.RENEWAL_FAILED]: {
      subscription: { kind: 'model', model: 'Subscription' },
      invoice: { kind: 'model', model: 'Invoice' },
      errorCode: { kind: 'scalar' },
    },
    [SubscriptionEvent.DEACTIVATION_UNPAID]: {
      subscription: { kind: 'model', model: 'Subscription' },
      invoice: { kind: 'model', model: 'Invoice' },
    },
    [SubscriptionEvent.DEACTIVATION_BY_USER]: {
      subscription: { kind: 'model', model: 'Subscription' },
    },
    [SubscriptionEvent.CUSTOM]: {
      subscription: { kind: 'model', model: 'Subscription' },
    },
  },
  user: {
    [UserEvent.ACCOUNT_CREATION]: {},
    [UserEvent.PASSWORD_RESET]: {},
    [UserEvent.LOGIN_LINK]: {},
    [UserEvent.TEST_MAIL]: {},
    [UserEvent.EMAIL_CHANGE]: {
      newEmail: { kind: 'scalar' },
    },
  },
};

type PlaceholderShape = { kind: 'scalar' } | { kind: 'model'; model: string };

@Injectable()
export class PlaceholderService {
  /**
   * Resolves the scalar field names of a Prisma model via the DMMF.
   * Drops list fields, JSON, relations and sensitive entries.
   */
  private getModelFields(modelName: string): string[] {
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === modelName);
    if (!model) {
      return [];
    }
    return model.fields
      .filter(f => SCALAR_KINDS.has(f.kind))
      .filter(f => !f.isList)
      .filter(f => modelName !== 'User' || !SENSITIVE_USER_FIELDS.has(f.name))
      .map(f => f.name);
  }

  /**
   * The placeholders that are available in every template, derived from the
   * sanitized `User` model plus the auto-generated login JWT.
   */
  getAlwaysAvailablePlaceholders(): MailPlaceholder[] {
    const userFields = this.getModelFields('User');
    const userPlaceholders: MailPlaceholder[] = userFields.map(field => ({
      key: `user_${field}`,
      description: `placeholderList.field.user.${field}`,
      scope: PlaceholderScope.Always,
      event: null,
    }));
    return [
      ...userPlaceholders,
      {
        key: 'jwt',
        description: 'placeholderList.field.jwt',
        scope: PlaceholderScope.Always,
        event: null,
      },
    ];
  }

  private getOptionalPlaceholdersForShape(
    shape: Record<string, PlaceholderShape>,
    scope: PlaceholderScope,
    event: SubscriptionEvent | UserEvent
  ): MailPlaceholder[] {
    const placeholders: MailPlaceholder[] = [];
    for (const [key, descriptor] of Object.entries(shape)) {
      if (descriptor.kind === 'scalar') {
        placeholders.push({
          key: `optional_${key}`,
          description: `placeholderList.field.optional.${key}`,
          scope,
          event,
        });
        continue;
      }
      const modelFields = this.getModelFields(descriptor.model);
      for (const field of modelFields) {
        placeholders.push({
          key: `optional_${key}_${field}`,
          description: `placeholderList.field.optional.${key}.${field}`,
          scope,
          event,
        });
      }
    }
    return placeholders;
  }

  getPlaceholdersForSubscriptionEvent(
    event: SubscriptionEvent
  ): MailPlaceholder[] {
    const optional = this.getOptionalPlaceholdersForShape(
      EVENT_OPTIONAL_SHAPE.subscription[event] ?? {},
      PlaceholderScope.SubscriptionEvent,
      event
    );
    return [...this.getAlwaysAvailablePlaceholders(), ...optional];
  }

  getPlaceholdersForUserEvent(event: UserEvent): MailPlaceholder[] {
    const optional = this.getOptionalPlaceholdersForShape(
      EVENT_OPTIONAL_SHAPE.user[event] ?? {},
      PlaceholderScope.UserEvent,
      event
    );
    return [...this.getAlwaysAvailablePlaceholders(), ...optional];
  }

  /**
   * Returns one entry per event (subscription + user) with the full list of
   * placeholders that can appear in that event's mail template.
   */
  getAllEventPlaceholders(): Array<{
    scope: PlaceholderScope;
    event: SubscriptionEvent | UserEvent;
    placeholders: MailPlaceholder[];
  }> {
    const result: Array<{
      scope: PlaceholderScope;
      event: SubscriptionEvent | UserEvent;
      placeholders: MailPlaceholder[];
    }> = [];
    for (const event of Object.values(SubscriptionEvent)) {
      result.push({
        scope: PlaceholderScope.SubscriptionEvent,
        event,
        placeholders: this.getPlaceholdersForSubscriptionEvent(event),
      });
    }
    for (const event of Object.values(UserEvent)) {
      result.push({
        scope: PlaceholderScope.UserEvent,
        event,
        placeholders: this.getPlaceholdersForUserEvent(event),
      });
    }
    return result;
  }
}

import { AuditLogAction } from '@prisma/client';
import {
  deriveAction,
  deriveEntity,
  deriveRecordId,
} from './derive-audit-entry';

describe('deriveAction', () => {
  it('maps create-like prefixes', () => {
    expect(deriveAction('createArticle')).toBe(AuditLogAction.create);
    expect(deriveAction('duplicateArticle')).toBe(AuditLogAction.create);
    expect(deriveAction('uploadImage')).toBe(AuditLogAction.create);
    expect(deriveAction('importEvents')).toBe(AuditLogAction.create);
  });

  it('maps update-like prefixes', () => {
    expect(deriveAction('updateArticle')).toBe(AuditLogAction.update);
    expect(deriveAction('publishPage')).toBe(AuditLogAction.update);
    expect(deriveAction('unpublishPage')).toBe(AuditLogAction.update);
    expect(deriveAction('resetPassword')).toBe(AuditLogAction.update);
  });

  it('maps delete-like prefixes', () => {
    expect(deriveAction('deleteUser')).toBe(AuditLogAction.delete);
    expect(deriveAction('revokeToken')).toBe(AuditLogAction.delete);
    expect(deriveAction('discardRevision')).toBe(AuditLogAction.delete);
  });

  it('prefers the longer prefix when two match', () => {
    expect(deriveAction('unpublishPage')).toBe(AuditLogAction.update);
    expect(deriveEntity('unpublishPage')).toBe('Page');
  });

  it('falls back to other for unknown prefixes', () => {
    expect(deriveAction('sendTestMail')).toBe(AuditLogAction.other);
    expect(deriveAction('triggerSync')).toBe(AuditLogAction.other);
  });
});

describe('deriveEntity', () => {
  it('strips the action prefix and capitalises the rest', () => {
    expect(deriveEntity('createArticle')).toBe('Article');
    expect(deriveEntity('updateUserRole')).toBe('UserRole');
    expect(deriveEntity('deleteMemberPlan')).toBe('MemberPlan');
  });

  it('returns null when there is no entity left', () => {
    expect(deriveEntity('create')).toBeNull();
  });

  it('returns null for an unknown prefix', () => {
    expect(deriveEntity('sendTestMail')).toBeNull();
  });
});

describe('deriveRecordId', () => {
  it('reads a top level id argument', () => {
    expect(deriveRecordId({ id: 'article-1' }, undefined)).toBe('article-1');
  });

  it('reads an id from a nested input argument', () => {
    expect(deriveRecordId({ input: { id: 'page-2' } }, undefined)).toBe(
      'page-2'
    );
  });

  it('falls back to the mutation result', () => {
    expect(deriveRecordId({}, { id: 'created-3' })).toBe('created-3');
  });

  it('prefers the argument over the result', () => {
    expect(deriveRecordId({ id: 'from-args' }, { id: 'from-result' })).toBe(
      'from-args'
    );
  });

  it('returns null when nothing carries an id', () => {
    expect(deriveRecordId({ name: 'no id here' }, { count: 3 })).toBeNull();
    expect(deriveRecordId(undefined, undefined)).toBeNull();
  });

  it('ignores non string ids', () => {
    expect(deriveRecordId({ id: 42 }, undefined)).toBeNull();
  });
});

import {
  CanCreatePrintIssue,
  CanDeletePrintIssue,
  CanFinalizePrintIssue,
  CanGetPrintIssues,
  CanGetSubscriptions,
  CanGetUsers,
} from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { PrintIssueResolver } from './print-issue.resolver';

const permissionsOf = (method: keyof PrintIssueResolver) =>
  Reflect.getMetadata(
    PERMISSIONS_METADATA_KEY,
    PrintIssueResolver.prototype[method]
  );

describe('PrintIssueResolver permissions', () => {
  it('lets the issue list be read with the print permission alone', () => {
    expect(permissionsOf('printIssues')).toEqual([CanGetPrintIssues]);
    expect(permissionsOf('printIssue')).toEqual([CanGetPrintIssues]);
  });

  it('guards every operation that returns addresses like the subscription export does', () => {
    for (const method of [
      'computePrintIssueRun',
      'printIssueRun',
      'printIssueCsv',
      'printExportContext',
    ] as const) {
      expect(permissionsOf(method)).toEqual([
        CanGetPrintIssues,
        CanGetSubscriptions,
        CanGetUsers,
      ]);
    }
    expect(permissionsOf('exportPrintIssueRun')).toEqual([
      CanCreatePrintIssue,
      CanGetSubscriptions,
      CanGetUsers,
    ]);
  });

  it('separates editing from deleting and from handing over and closing', () => {
    for (const method of [
      'createPrintIssue',
      'updatePrintIssue',
      'duplicatePrintIssue',
    ] as const) {
      expect(permissionsOf(method)).toEqual([CanCreatePrintIssue]);
    }
    for (const method of [
      'deletePrintIssue',
      'deletePrintIssueDelivery',
    ] as const) {
      expect(permissionsOf(method)).toEqual([CanDeletePrintIssue]);
    }
    for (const method of [
      'deliverPrintIssueDelivery',
      'closePrintIssue',
      'reopenPrintIssue',
    ] as const) {
      expect(permissionsOf(method)).toEqual([CanFinalizePrintIssue]);
    }
  });

  it('has neither the finalize step nor previews: lists are computed, checked, exported and handed over', () => {
    for (const method of [
      'finalizePrintIssue',
      'addPrintIssueSupplement',
      'printIssuePreview',
      'printIssueSupplementPreview',
    ]) {
      expect(method in PrintIssueResolver.prototype).toBe(false);
    }
  });
});

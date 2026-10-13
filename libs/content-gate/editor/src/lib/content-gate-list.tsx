import { GateMode } from '@wepublish/editor/api';
import { GateList } from '@wepublish/gate/editor';
import {
  CanCreateContentGate,
  CanDeleteContentGate,
  CanUpdateContentGate,
} from '@wepublish/permissions';
import { createCheckedPermissionComponent, Link } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { CONTENT_GATE_AUDIENCES } from './content-gate-form';

function ContentGateList() {
  const { t } = useTranslation();

  return (
    <GateList
      mode={GateMode.ContentGate}
      storageKey="content-gates"
      title={t('contentGate.list.title')}
      description={t('contentGate.list.description')}
      createLabel={t('contentGate.list.createNew')}
      columns={[
        {
          id: 'active',
          label: t('contentGate.list.active'),
          width: 100,
          render: gate => (gate.active ? '✓' : '⨯'),
        },
        {
          id: 'name',
          alwaysVisible: true,
          label: t('contentGate.list.name'),
          width: 300,
          render: gate => <Link to={`edit/${gate.id}`}>{gate.name}</Link>,
        },
        {
          id: 'audience',
          label: t('contentGate.list.audience'),
          width: 250,
          render: gate =>
            t(`contentGate.audience.${CONTENT_GATE_AUDIENCES[gate.audience]}`),
        },
        {
          id: 'metering',
          label: t('contentGate.list.metering'),
          width: 300,
          render: gate => {
            const free = gate.freeArticles ?? 0;
            const soft = gate.softGateArticles ?? 0;

            return t('contentGate.list.meteringSummary', {
              free,
              soft,
              hard: free + soft + 1,
            });
          },
        },
      ]}
      deleteTexts={gate => ({
        title: t('contentGate.delete.title'),
        body: t('contentGate.delete.body', { name: gate.name }),
        confirm: t('contentGate.delete.delete'),
      })}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateContentGate.id,
  CanUpdateContentGate.id,
  CanDeleteContentGate.id,
])(ContentGateList);
export { CheckedPermissionComponent as ContentGateList };

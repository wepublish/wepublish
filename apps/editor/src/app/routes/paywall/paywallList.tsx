import { GateMode } from '@wepublish/editor/api';
import { GateList } from '@wepublish/gate/editor';
import {
  CanCreatePaywall,
  CanDeletePaywall,
  CanUpdatePaywall,
} from '@wepublish/permissions';
import { createCheckedPermissionComponent, Link } from '@wepublish/ui/editor';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

function PaywallList() {
  const { t } = useTranslation();

  return (
    <GateList
      mode={GateMode.Paywall}
      storageKey="paywalls"
      title={t('paywall.overview.title')}
      createLabel={t('paywall.overview.createPaywall')}
      columns={[
        {
          id: 'active',
          label: t('paywall.overview.active'),
          width: 75,
          render: paywall => (paywall.active ? `✅` : `❌`),
        },
        {
          id: 'name',
          alwaysVisible: true,
          label: t('paywall.overview.name'),
          width: 300,
          render: paywall => (
            <Link to={`edit/${paywall.id}`}>{paywall.name}</Link>
          ),
        },
        {
          id: 'memberplans',
          label: t('paywall.overview.memberPlans'),
          width: 500,
          render: paywall =>
            paywall.anyMemberPlan ?
              t('paywall.overview.anyMemberPlan')
            : paywall.memberPlans.map((mb, index) => (
                <Fragment key={mb.id}>
                  <Link to={`/memberplans/edit/${mb.id}`}>{mb.name}</Link>

                  {!!paywall.memberPlans.at(index + 1) && <>, </>}
                </Fragment>
              )),
        },
      ]}
      deleteTexts={paywall => ({
        title: t('paywall.overview.areYouSure'),
        body: t('paywall.overview.areYouSureBody', { paywall: paywall.name }),
        confirm: t('paywall.overview.areYouSureConfirmation'),
      })}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreatePaywall.id,
  CanUpdatePaywall.id,
  CanDeletePaywall.id,
])(PaywallList);

export { CheckedPermissionComponent as PaywallList };

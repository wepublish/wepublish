import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdMail, MdSend } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { Nav } from 'rsuite';
import { MailLogTable } from './mail-log-table';
import { MailSendJobList } from './mail-send-job-list';

const TAB_MAILS = 'mails';
const TAB_JOBS = 'jobs';

/**
 * Everything that was sent, from two angles: the individual mails, and the bulk
 * sends that produced them. Both live under one heading because an editor
 * looking for "did this arrive?" and one looking for "did this send finish?"
 * start in the same place.
 *
 * Which tab is shown and which send is selected are URL state, so both can be
 * linked to — the send page points here after a job was started.
 */
function MailLogList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get('tab') === TAB_JOBS ? TAB_JOBS : TAB_MAILS;
  // On the mail tab a job narrows the list; on the job tab it opens that job.
  const jobId = searchParams.get('job');

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    setSearchParams(next);
  };

  return (
    <div style={{ flexShrink: 0 }}>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('mailLog.title')}</h2>
        </ListViewHeader>
      </ListViewContainer>

      <Nav
        appearance="subtle"
        activeKey={tab}
        onSelect={value =>
          setParam('tab', value === TAB_JOBS ? TAB_JOBS : null)
        }
        style={{ marginTop: 16, marginBottom: 16 }}
      >
        <Nav.Item
          eventKey={TAB_MAILS}
          icon={<MdMail />}
        >
          {t('mailLog.tabs.mails')}
        </Nav.Item>
        <Nav.Item
          eventKey={TAB_JOBS}
          icon={<MdSend />}
        >
          {t('mailLog.tabs.jobs')}
        </Nav.Item>
      </Nav>

      {tab === TAB_JOBS ?
        <MailSendJobList
          selectedJobId={jobId}
          onSelectJob={value => setParam('job', value)}
        />
      : <MailLogTable />}
    </div>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-LOGS',
])(MailLogList);
export { CheckedPermissionComponent as MailLogList };

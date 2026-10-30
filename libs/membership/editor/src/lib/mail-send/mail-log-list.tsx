import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdMail, MdSend } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { MailLogTable } from './mail-log-table';
import { Tab, Tabs } from '@mui/material';
import { MailSendJobList } from './mail-send-job-list';
import { CanGetMailLogs } from '@wepublish/permissions';

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
          <PageTitle>{t('mailLog.title')}</PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      <Tabs
        value={tab}
        onChange={(_event, value) =>
          setParam('tab', value === TAB_JOBS ? TAB_JOBS : null)
        }
        style={{ marginTop: 16, marginBottom: 16 }}
      >
        <Tab
          value={TAB_MAILS}
          icon={<MdMail />}
          iconPosition="start"
          label={<>{t('mailLog.tabs.mails')}</>}
        />
        <Tab
          value={TAB_JOBS}
          icon={<MdSend />}
          iconPosition="start"
          label={<>{t('mailLog.tabs.jobs')}</>}
        />
      </Tabs>

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
  CanGetMailLogs.id,
])(MailLogList);
export { CheckedPermissionComponent as MailLogList };

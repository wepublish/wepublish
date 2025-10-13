import { Router } from 'express';
import { contextFromRequest } from './context';
import { WepublishServerOpts } from './server';
import { logger } from '@wepublish/utils/api';

export function setupMailProvider(opts: WepublishServerOpts): Router {
  const { mailProvider } = opts;
  const mailProviderWebhookRouter = Router();
  if (mailProvider) {
    mailProviderWebhookRouter
      .route(`/${mailProvider.id}`)
      .all(mailProvider.incomingRequestHandler, async (req, res) => {
        res.status(200).send(); // respond immediately with 200 since webhook was received.
        logger('mailProvider').info(
          'Received webhook from %s for mailProvider %s',
          req.get('origin'),
          mailProvider.id
        );

        try {
          const mailLogStatuses = await mailProvider.webhookForSendMail({
            req,
          });
          const context = await contextFromRequest(req, opts);

          for (const mailLogStatus of mailLogStatuses) {
            const mailLog = await context.loaders.mailLogsByID.load(
              mailLogStatus.mailLogID
            );
            if (!mailLog) continue; // TODO: handle missing mailLog

            await context.prisma.mailLog.update({
              where: { id: mailLog.id },
              data: {
                subject: mailLog.subject,
                mailProviderID: mailLog.mailProviderID,
                state: mailLogStatus.state,
                mailData: mailLogStatus.mailData,
              },
            });
          }
        } catch (error) {
          logger('mailProvider').error(
            error as Error,
            'Error during webhook update in mailProvider %s',
            mailProvider.id
          );
        }
      });
  }

  return mailProviderWebhookRouter;
}

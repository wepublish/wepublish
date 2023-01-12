import { Context } from './context';
export declare enum JobType {
    DailyMembershipRenewal = "dailyMembershipRenewal",
    DailyInvoiceChecker = "dailyInvoiceChecker",
    DailyInvoiceCharger = "dailyInvoiceCharger",
    DailyInvoiceReminder = "dailyInvoiceReminder",
    SendTestMail = "sendTestMail"
}
export declare function runJob(command: JobType, context: Context, data: any): Promise<void>;
//# sourceMappingURL=jobs.d.ts.map
-- UpdateInvoices
UPDATE invoices SET "scheduledDeactivationAt" = "dueAt" + INTERVAL '14 days' WHERE "paidAt" IS NULL AND "canceledAt" IS NULL

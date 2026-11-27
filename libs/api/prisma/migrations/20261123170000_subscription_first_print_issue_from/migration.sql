-- «Abo-Start»: the first printed issue is the first one shipped on or after this day
ALTER TABLE "subscriptions" ADD COLUMN "firstPrintIssueFrom" DATE;

-- CreateEnum
CREATE TYPE "ChangelogSeverity" AS ENUM ('INFO', 'RECOMMENDED', 'REQUIRED');

-- AlterTable
ALTER TABLE "changelog.entries" ADD COLUMN "severity" "ChangelogSeverity" NOT NULL DEFAULT 'INFO';

-- Every entry that asked for an action so far keeps being shown as prominently
-- as before. The next sync applies the severity written in its changelog.md.
UPDATE "changelog.entries" SET "severity" = 'REQUIRED' WHERE "actionRequired" = true;

-- AlterTable
ALTER TABLE "changelog.entries" DROP COLUMN "actionRequired";

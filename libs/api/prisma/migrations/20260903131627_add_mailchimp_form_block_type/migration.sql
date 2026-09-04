-- The value stands in schema.prisma on master without a migration ever adding
-- it, so a database set with `prisma db push` already has it. IF NOT EXISTS
-- keeps such a database deployable; Postgres knows no DROP VALUE, which is why
-- this irreversible step is kept apart from the reversible migration beside it.

-- AlterEnum
ALTER TYPE "BlockType" ADD VALUE IF NOT EXISTS 'mailchimpForm';

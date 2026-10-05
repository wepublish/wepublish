-- Adds the "author" block type so block styles can target Author blocks.
ALTER TYPE "BlockType" ADD VALUE IF NOT EXISTS 'author';

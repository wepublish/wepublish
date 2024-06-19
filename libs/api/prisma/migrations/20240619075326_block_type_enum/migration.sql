-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BlockType" ADD VALUE 'facebookPost';
ALTER TYPE "BlockType" ADD VALUE 'facebookVideo';
ALTER TYPE "BlockType" ADD VALUE 'instagramPost';
ALTER TYPE "BlockType" ADD VALUE 'twitterTweet';
ALTER TYPE "BlockType" ADD VALUE 'vimeoVideo';
ALTER TYPE "BlockType" ADD VALUE 'youTubeVideo';
ALTER TYPE "BlockType" ADD VALUE 'soundCloudTrack';
ALTER TYPE "BlockType" ADD VALUE 'polisConversation';
ALTER TYPE "BlockType" ADD VALUE 'tikTokVideo';
ALTER TYPE "BlockType" ADD VALUE 'bildwurfAd';
ALTER TYPE "BlockType" ADD VALUE 'teaserGrid';

/*
  Warnings:

  - You are about to drop the column `authorIDs` on the `articles.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `socialMediaAuthorIDs` on the `articles.revisions` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "articles.revisions.author" (
    "revisionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "articles.revisions.author_pkey" PRIMARY KEY ("revisionId","authorId")
);

CREATE TABLE "articles.revisions.social-media-author" (
    "revisionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "articles.revisions.social-media-author_pkey" PRIMARY KEY ("revisionId","authorId")
);

-- AddForeignKey
ALTER TABLE "articles.revisions.author" ADD CONSTRAINT "articles.revisions.author_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "articles.revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "articles.revisions.social-media-author" ADD CONSTRAINT "articles.revisions.social-media-author_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "articles.revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.author" ADD CONSTRAINT "articles.revisions.author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "articles.revisions.social-media-author" ADD CONSTRAINT "articles.revisions.social-media-author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData
INSERT INTO "articles.revisions.author"("authorId", "revisionId")
SELECT o.authorId as authorId, o.revisionId as revisionId FROM (
	SELECT i.id as revisionId, authorId
	FROM (
		SELECT id, unnest("authorIDs") as authorId
		FROM "articles.revisions"
	)i
	GROUP BY authorId, revisionId
	ORDER BY authorId
)o;

INSERT INTO "articles.revisions.social-media-author"("authorId", "revisionId")
SELECT o.authorId as authorId, o.revisionId as revisionId FROM (
	SELECT i.id as revisionId, authorId
	FROM (
		SELECT id, unnest("socialMediaAuthorIDs") as authorId
		FROM "articles.revisions"
	)i
	GROUP BY authorId, revisionId
	ORDER BY authorId
)o;

-- AlterTable
ALTER TABLE "articles.revisions" DROP COLUMN "authorIDs";
ALTER TABLE "articles.revisions" DROP COLUMN "socialMediaAuthorIDs";

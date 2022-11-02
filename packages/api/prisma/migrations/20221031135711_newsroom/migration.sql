-- CreateTable
CREATE TABLE "newsrooms" (
                             "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                             "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             "name" TEXT NOT NULL,
                             "slug" TEXT,
                             "hostURL" TEXT,
                             "token" TEXT,
                             "isDisabled" BOOLEAN NOT NULL DEFAULT false,
                             "themeColor" TEXT DEFAULT E'#000000',
                             "themeFontColor" TEXT DEFAULT E'#FFFFFF',
                             "callToActionURL" TEXT,
                             "callToActionText" JSONB[],
                             "callToActionImageURL" TEXT,
                             "callToActionImageID" TEXT,
                             "logoID" TEXT,

                             CONSTRAINT "newsrooms_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "newsrooms" ADD CONSTRAINT "newsrooms_logoID_fkey" FOREIGN KEY ("logoID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add records from peers to newsrooms
INSERT INTO "newsrooms"(name, "slug", "hostURL", token, "isDisabled") SELECT name, slug, "hostURL", token, "isDisabled" FROM "peers";

-- Add records from peerProfiles to newsrooms
INSERT INTO "newsrooms"(name, "themeColor", "themeFontColor", "callToActionURL", "callToActionText", "callToActionImageURL", "callToActionImageID", "logoID")
SELECT name, "themeColor", "themeFontColor", "callToActionURL", "callToActionText", "callToActionImageURL", "callToActionImageID", "logoID" FROM "peerProfiles";

DROP TABLE "peers";
DROP TABLE "peerProfiles";
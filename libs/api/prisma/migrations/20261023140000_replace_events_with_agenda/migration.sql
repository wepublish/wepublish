-- DropTable
DROP TABLE "events.tagged-events";

-- DropTable
DROP TABLE "events";

-- DropEnum
DROP TYPE "EventStatus";

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('confirmed', 'cancelled', 'postponed', 'soldOut');

-- CreateEnum
CREATE TYPE "EventScheduleType" AS ENUM ('continuous', 'weekly', 'explicit');

-- CreateTable
CREATE TABLE "events.places" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "about" TEXT,
    "capacity" TEXT,
    "website" TEXT,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccessibleToilets" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccessibleParking" BOOLEAN NOT NULL DEFAULT false,
    "proInfirmisIdSource" TEXT,
    "proInfirmisDetailUrl" TEXT,
    "proInfirmisPictograms" JSONB,
    "regionId" TEXT,
    "organizationId" TEXT,
    "legacyId" BIGINT,

    CONSTRAINT "events.places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.audiences" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "legacyId" BIGINT,

    CONSTRAINT "events.audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.affiliations" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "legacyId" BIGINT,

    CONSTRAINT "events.affiliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.organizations.affiliations" (
    "organizationId" TEXT NOT NULL,
    "affiliationId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events.organizations.affiliations_pkey" PRIMARY KEY ("organizationId","affiliationId")
);

-- CreateTable
CREATE TABLE "events.organizations.tags" (
    "organizationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events.organizations.tags_pkey" PRIMARY KEY ("organizationId","tagId")
);

-- CreateTable
CREATE TABLE "events.contacts" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "legacyId" BIGINT,

    CONSTRAINT "events.contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.events" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "slug" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'confirmed',
    "organizationId" TEXT,
    "placeId" TEXT,
    "ownerId" TEXT,
    "scheduleType" "EventScheduleType" NOT NULL,
    "dateFrom" TIMESTAMPTZ(3),
    "dateTo" TIMESTAMPTZ(3),
    "weekDays" INTEGER[],
    "openingTime" TEXT,
    "audienceId" TEXT,
    "ticketingUrl" TEXT,
    "showInPrint" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "socialMediaTitle" TEXT,
    "socialMediaDescription" TEXT,
    "socialMediaImageID" TEXT,
    "publishedAt" TIMESTAMPTZ(3),
    "firstDateAt" TIMESTAMPTZ(3),
    "lastDateAt" TIMESTAMPTZ(3),
    "reviewRequestedAt" TIMESTAMPTZ(3),
    "reviewRequestedById" TEXT,
    "legacyId" BIGINT,
    "legacyProposedBy" JSONB,

    CONSTRAINT "events.events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.events.revisions" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "printDescription" TEXT,
    "blocks" JSONB NOT NULL,
    "descriptionText" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "userId" TEXT,

    CONSTRAINT "events.events.revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.events.revisions.images" (
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisionId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "events.events.revisions.images_pkey" PRIMARY KEY ("revisionId","imageId")
);

-- CreateTable
CREATE TABLE "events.events.dates" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "dateFrom" TIMESTAMPTZ(3) NOT NULL,
    "dateTo" TIMESTAMPTZ(3) NOT NULL,
    "openingTime" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "legacyEventId" BIGINT,

    CONSTRAINT "events.events.dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.occurrences" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "dateFrom" TIMESTAMPTZ(3) NOT NULL,
    "dateTo" TIMESTAMPTZ(3) NOT NULL,
    "openingTime" TEXT,
    "legacyEventId" BIGINT,

    CONSTRAINT "events.occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.rates" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "designation" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "legacyId" BIGINT,

    CONSTRAINT "events.rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.tagged-events" (
    "eventId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events.tagged-events_pkey" PRIMARY KEY ("eventId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "events.places_slug_key" ON "events.places"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events.places_legacyId_key" ON "events.places"("legacyId");

-- CreateIndex
CREATE INDEX "events.places_createdAt_idx" ON "events.places"("createdAt");

-- CreateIndex
CREATE INDEX "events.places_name_idx" ON "events.places"("name");

-- CreateIndex
CREATE INDEX "events.places_regionId_idx" ON "events.places"("regionId");

-- CreateIndex
CREATE INDEX "events.places_organizationId_idx" ON "events.places"("organizationId");

-- CreateIndex
CREATE INDEX "events.places_latitude_longitude_idx" ON "events.places"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "events.audiences_slug_key" ON "events.audiences"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events.audiences_legacyId_key" ON "events.audiences"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "events.affiliations_slug_key" ON "events.affiliations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events.affiliations_legacyId_key" ON "events.affiliations"("legacyId");

-- CreateIndex
CREATE INDEX "events.organizations.affiliations_affiliationId_idx" ON "events.organizations.affiliations"("affiliationId");

-- CreateIndex
CREATE INDEX "events.organizations.tags_tagId_idx" ON "events.organizations.tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "events.contacts_legacyId_key" ON "events.contacts"("legacyId");

-- CreateIndex
CREATE INDEX "events.contacts_organizationId_idx" ON "events.contacts"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "events.events_legacyId_key" ON "events.events"("legacyId");

-- CreateIndex
CREATE INDEX "events.events_createdAt_idx" ON "events.events"("createdAt");

-- CreateIndex
CREATE INDEX "events.events_modifiedAt_idx" ON "events.events"("modifiedAt");

-- CreateIndex
CREATE INDEX "events.events_slug_idx" ON "events.events"("slug");

-- CreateIndex
CREATE INDEX "events.events_organizationId_idx" ON "events.events"("organizationId");

-- CreateIndex
CREATE INDEX "events.events_placeId_idx" ON "events.events"("placeId");

-- CreateIndex
CREATE INDEX "events.events_ownerId_idx" ON "events.events"("ownerId");

-- CreateIndex
CREATE INDEX "events.events_audienceId_idx" ON "events.events"("audienceId");

-- CreateIndex
CREATE INDEX "events.events_status_idx" ON "events.events"("status");

-- CreateIndex
CREATE INDEX "events.events_reviewRequestedAt_idx" ON "events.events"("reviewRequestedAt");

-- CreateIndex
CREATE INDEX "events.events_publishedAt_idx" ON "events.events"("publishedAt");

-- CreateIndex
CREATE INDEX "events.events_firstDateAt_idx" ON "events.events"("firstDateAt");

-- CreateIndex
CREATE INDEX "events.events_lastDateAt_idx" ON "events.events"("lastDateAt");

-- CreateIndex
CREATE INDEX "events.events.revisions_publishedAt_idx" ON "events.events.revisions"("publishedAt");

-- CreateIndex
CREATE INDEX "events.events.revisions_eventId_createdAt_id_idx" ON "events.events.revisions"("eventId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "events.events.revisions.images_imageId_idx" ON "events.events.revisions.images"("imageId");

-- CreateIndex
CREATE INDEX "events.events.dates_eventId_idx" ON "events.events.dates"("eventId");

-- CreateIndex
CREATE INDEX "events.occurrences_eventId_idx" ON "events.occurrences"("eventId");

-- CreateIndex
CREATE INDEX "events.occurrences_dateFrom_idx" ON "events.occurrences"("dateFrom");

-- CreateIndex
CREATE INDEX "events.occurrences_dateTo_idx" ON "events.occurrences"("dateTo");

-- CreateIndex
CREATE UNIQUE INDEX "events.rates_legacyId_key" ON "events.rates"("legacyId");

-- CreateIndex
CREATE INDEX "events.rates_eventId_idx" ON "events.rates"("eventId");

-- CreateIndex
CREATE INDEX "events.tagged-events_tagId_idx" ON "events.tagged-events"("tagId");

-- AddForeignKey
ALTER TABLE "events.places" ADD CONSTRAINT "events.places_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "events.regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.places" ADD CONSTRAINT "events.places_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "events.organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.organizations.affiliations" ADD CONSTRAINT "events.organizations.affiliations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "events.organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.organizations.affiliations" ADD CONSTRAINT "events.organizations.affiliations_affiliationId_fkey" FOREIGN KEY ("affiliationId") REFERENCES "events.affiliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.organizations.tags" ADD CONSTRAINT "events.organizations.tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "events.organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.organizations.tags" ADD CONSTRAINT "events.organizations.tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.contacts" ADD CONSTRAINT "events.contacts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "events.organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events" ADD CONSTRAINT "events.events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "events.organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events" ADD CONSTRAINT "events.events_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "events.places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events" ADD CONSTRAINT "events.events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events" ADD CONSTRAINT "events.events_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "events.audiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events" ADD CONSTRAINT "events.events_socialMediaImageID_fkey" FOREIGN KEY ("socialMediaImageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events" ADD CONSTRAINT "events.events_reviewRequestedById_fkey" FOREIGN KEY ("reviewRequestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events.revisions" ADD CONSTRAINT "events.events.revisions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events.events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events.revisions" ADD CONSTRAINT "events.events.revisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events.revisions.images" ADD CONSTRAINT "events.events.revisions.images_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "events.events.revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events.revisions.images" ADD CONSTRAINT "events.events.revisions.images_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.events.dates" ADD CONSTRAINT "events.events.dates_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events.events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.occurrences" ADD CONSTRAINT "events.occurrences_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events.events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.rates" ADD CONSTRAINT "events.rates_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events.events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.tagged-events" ADD CONSTRAINT "events.tagged-events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events.events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.tagged-events" ADD CONSTRAINT "events.tagged-events_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Revision views
CREATE VIEW "events.events.revisions.published" AS
    SELECT DISTINCT ON ("eventId")
        id,
        "eventId"
    FROM
        "events.events.revisions"
    WHERE
        "publishedAt" IS NOT NULL AND "publishedAt" <= CURRENT_TIMESTAMP
    ORDER BY
        "eventId", "createdAt" DESC, id DESC
;

CREATE INDEX event_revisions_published_by_event_created_id_desc
    ON "events.events.revisions" ("eventId", "createdAt" DESC, "id" DESC)
    INCLUDE ("publishedAt")
    WHERE "publishedAt" IS NOT NULL;

CREATE VIEW "events.events.revisions.pending" AS
    SELECT DISTINCT ON ("eventId")
        id,
        "eventId"
    FROM
        "events.events.revisions"
    WHERE
        "publishedAt" IS NOT NULL AND "publishedAt" > CURRENT_TIMESTAMP
    ORDER BY
        "eventId", "createdAt" DESC, id DESC
;

CREATE VIEW "events.events.revisions.draft" AS
    SELECT DISTINCT ON ("eventId")
        id,
        "eventId"
    FROM
        "events.events.revisions"
    WHERE
        "archivedAt" IS NULL AND "publishedAt" IS NULL
    ORDER BY
        "eventId", "createdAt" DESC, id DESC
;

CREATE INDEX event_revisions_draft_by_event_created
    ON "events.events.revisions" ("eventId", "createdAt" DESC, "id" DESC)
    WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL;

-- Accent-insensitive search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

CREATE OR REPLACE FUNCTION events_unaccent(text) RETURNS text AS $$
    SELECT public.unaccent('public.unaccent'::regdictionary, $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

CREATE INDEX event_revisions_search_trgm_idx
    ON "events.events.revisions"
    USING GIN (events_unaccent(coalesce("name", '') || ' ' || coalesce("descriptionText", '')) gin_trgm_ops);

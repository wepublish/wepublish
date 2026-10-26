
-- CreateTable
CREATE TABLE "events.regions" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "legacyId" BIGINT,

    CONSTRAINT "events.regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.organizations" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "subTitle" TEXT,
    "about" TEXT,
    "website" TEXT,
    "legalStatus" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "partner" BOOLEAN NOT NULL DEFAULT false,
    "createdByMigration" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "postOfficeBox" TEXT,
    "zip" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "regionId" TEXT,
    "legacyId" BIGINT,

    CONSTRAINT "events.organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events.organizations.members" (
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events.organizations.members_pkey" PRIMARY KEY ("userId","organizationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "events.regions_slug_key" ON "events.regions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events.regions_legacyId_key" ON "events.regions"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "events.organizations_slug_key" ON "events.organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events.organizations_legacyId_key" ON "events.organizations"("legacyId");

-- CreateIndex
CREATE INDEX "events.organizations_createdAt_idx" ON "events.organizations"("createdAt");

-- CreateIndex
CREATE INDEX "events.organizations_name_idx" ON "events.organizations"("name");

-- CreateIndex
CREATE INDEX "events.organizations_regionId_idx" ON "events.organizations"("regionId");

-- CreateIndex
CREATE INDEX "events.organizations.members_organizationId_idx" ON "events.organizations.members"("organizationId");

-- AddForeignKey
ALTER TABLE "events.organizations" ADD CONSTRAINT "events.organizations_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "events.regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.organizations.members" ADD CONSTRAINT "events.organizations.members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.organizations.members" ADD CONSTRAINT "events.organizations.members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "events.organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


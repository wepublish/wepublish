-- CreateTable
CREATE TABLE "paywall_bypasses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "paywallId" UUID NOT NULL,

    CONSTRAINT "paywall_bypasses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paywall_bypasses_token_key" ON "paywall_bypasses"("token");

-- AddForeignKey
ALTER TABLE "paywall_bypasses" ADD CONSTRAINT "paywall_bypasses_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

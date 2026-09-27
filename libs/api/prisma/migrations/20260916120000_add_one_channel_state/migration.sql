-- CreateTable
CREATE TABLE "one_channel_state" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastSuccessAt" TIMESTAMPTZ(3),

    CONSTRAINT "one_channel_state_pkey" PRIMARY KEY ("id")
);

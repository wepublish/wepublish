-- AlterTable
ALTER TABLE "_BannerToPage" ADD CONSTRAINT "_BannerToPage_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BannerToPage_AB_unique";

-- AlterTable
ALTER TABLE "_CrowdfundingToMemberPlan" ADD CONSTRAINT "_CrowdfundingToMemberPlan_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CrowdfundingToMemberPlan_AB_unique";

-- AlterTable
ALTER TABLE "_PaymentMethodToSubscriptionFlow" ADD CONSTRAINT "_PaymentMethodToSubscriptionFlow_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_PaymentMethodToSubscriptionFlow_AB_unique";

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "collapsible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hideForMinutes" INTEGER NOT NULL DEFAULT 1440;

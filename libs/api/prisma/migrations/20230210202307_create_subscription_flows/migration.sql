-- CreateTable
CREATE TABLE "user_communication_flows" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "accountCreationMailTemplateId" INTEGER,
    "passwordResetMailTemplateId" INTEGER,
    "loginLinkMailTemplateId" INTEGER,

    CONSTRAINT "user_communication_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_communication_flows" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "memberPlanId" TEXT,
    "periodicities" "PaymentPeriodicity"[],
    "autoRenewal" BOOLEAN[],
    "subscribeMailTemplateId" INTEGER,
    "invoiceCreationMailTemplateId" INTEGER,
    "renewalSuccessMailTemplateId" INTEGER,
    "renewalFailedMailTemplateId" INTEGER,
    "deactivationUnpaidMailTemplateId" INTEGER,
    "deactivationByUserMailTemplateId" INTEGER,
    "reactivationMailTemplateId" INTEGER,

    CONSTRAINT "subscription_communication_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions.intervals" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "daysAwayFromEnding" SMALLINT NOT NULL,
    "mailTemplateId" INTEGER NOT NULL,

    CONSTRAINT "subscriptions.intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_templates" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "externalMailTemplateId" TEXT NOT NULL,
    "remoteMissing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "mail_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PaymentMethodToSubscriptionFlow" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_SubscriptionFlowToSubscriptionInterval" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_communication_flows_accountCreationMailTemplateId_key" ON "user_communication_flows"("accountCreationMailTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "user_communication_flows_passwordResetMailTemplateId_key" ON "user_communication_flows"("passwordResetMailTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "user_communication_flows_loginLinkMailTemplateId_key" ON "user_communication_flows"("loginLinkMailTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "mail_templates_externalMailTemplateId_key" ON "mail_templates"("externalMailTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "_PaymentMethodToSubscriptionFlow_AB_unique" ON "_PaymentMethodToSubscriptionFlow"("A", "B");

-- CreateIndex
CREATE INDEX "_PaymentMethodToSubscriptionFlow_B_index" ON "_PaymentMethodToSubscriptionFlow"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SubscriptionFlowToSubscriptionInterval_AB_unique" ON "_SubscriptionFlowToSubscriptionInterval"("A", "B");

-- CreateIndex
CREATE INDEX "_SubscriptionFlowToSubscriptionInterval_B_index" ON "_SubscriptionFlowToSubscriptionInterval"("B");

-- AddForeignKey
ALTER TABLE "user_communication_flows" ADD CONSTRAINT "user_communication_flows_accountCreationMailTemplateId_fkey" FOREIGN KEY ("accountCreationMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_communication_flows" ADD CONSTRAINT "user_communication_flows_passwordResetMailTemplateId_fkey" FOREIGN KEY ("passwordResetMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_communication_flows" ADD CONSTRAINT "user_communication_flows_loginLinkMailTemplateId_fkey" FOREIGN KEY ("loginLinkMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_invoiceCreationMailTempla_fkey" FOREIGN KEY ("invoiceCreationMailTemplateId") REFERENCES "subscriptions.intervals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_deactivationUnpaidMailTem_fkey" FOREIGN KEY ("deactivationUnpaidMailTemplateId") REFERENCES "subscriptions.intervals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_subscribeMailTemplateId_fkey" FOREIGN KEY ("subscribeMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_renewalSuccessMailTemplat_fkey" FOREIGN KEY ("renewalSuccessMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_renewalFailedMailTemplate_fkey" FOREIGN KEY ("renewalFailedMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_deactivationByUserMailTem_fkey" FOREIGN KEY ("deactivationByUserMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_reactivationMailTemplateI_fkey" FOREIGN KEY ("reactivationMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.intervals" ADD CONSTRAINT "subscriptions.intervals_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentMethodToSubscriptionFlow" ADD CONSTRAINT "_PaymentMethodToSubscriptionFlow_A_fkey" FOREIGN KEY ("A") REFERENCES "payment.methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentMethodToSubscriptionFlow" ADD CONSTRAINT "_PaymentMethodToSubscriptionFlow_B_fkey" FOREIGN KEY ("B") REFERENCES "subscription_communication_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubscriptionFlowToSubscriptionInterval" ADD CONSTRAINT "_SubscriptionFlowToSubscriptionInterval_A_fkey" FOREIGN KEY ("A") REFERENCES "subscription_communication_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubscriptionFlowToSubscriptionInterval" ADD CONSTRAINT "_SubscriptionFlowToSubscriptionInterval_B_fkey" FOREIGN KEY ("B") REFERENCES "subscriptions.intervals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

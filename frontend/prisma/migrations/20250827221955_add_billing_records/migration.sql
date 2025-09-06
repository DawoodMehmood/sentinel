-- CreateTable
CREATE TABLE "BillingRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingRecord_stripeSessionId_key" ON "BillingRecord"("stripeSessionId");

-- CreateIndex
CREATE INDEX "BillingRecord_companyId_paidAt_idx" ON "BillingRecord"("companyId", "paidAt");

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "SeqPatternCompany" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "n" INTEGER NOT NULL,
    "seqKey" TEXT NOT NULL,
    "support" INTEGER NOT NULL DEFAULT 0,
    "employees" INTEGER NOT NULL DEFAULT 0,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeqPatternCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeqPatternCompany_companyId_support_idx" ON "SeqPatternCompany"("companyId", "support");

-- CreateIndex
CREATE INDEX "SeqPatternCompany_companyId_employees_idx" ON "SeqPatternCompany"("companyId", "employees");

-- CreateIndex
CREATE UNIQUE INDEX "SeqPatternCompany_companyId_n_seqKey_key" ON "SeqPatternCompany"("companyId", "n", "seqKey");

-- AddForeignKey
ALTER TABLE "SeqPatternCompany" ADD CONSTRAINT "SeqPatternCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

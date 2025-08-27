-- CreateTable
CREATE TABLE "PatternCursor" (
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "lastCreatedAt" TIMESTAMP(3),
    "tail" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatternCursor_pkey" PRIMARY KEY ("companyId","employeeId")
);

-- CreateIndex
CREATE INDEX "PatternCursor_companyId_employeeId_idx" ON "PatternCursor"("companyId", "employeeId");

-- AddForeignKey
ALTER TABLE "PatternCursor" ADD CONSTRAINT "PatternCursor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternCursor" ADD CONSTRAINT "PatternCursor_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

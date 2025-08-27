-- CreateIndex
CREATE INDEX "ActivitySpan_companyId_employeeId_createdAt_idx" ON "ActivitySpan"("companyId", "employeeId", "createdAt");

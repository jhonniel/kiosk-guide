-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "VisitorLog_createdAt_idx" ON "VisitorLog"("createdAt");

-- CreateIndex
CREATE INDEX "VisitorLog_sessionId_idx" ON "VisitorLog"("sessionId");

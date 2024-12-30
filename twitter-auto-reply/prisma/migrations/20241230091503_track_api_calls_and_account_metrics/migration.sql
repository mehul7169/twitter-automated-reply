/*
  Warnings:

  - You are about to drop the column `account` on the `TwitterAction` table. All the data in the column will be lost.
  - You are about to drop the column `actionType` on the `TwitterAction` table. All the data in the column will be lost.
  - Added the required column `requestId` to the `TwitterAction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tweetId` to the `TwitterAction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TwitterAction" DROP COLUMN "account",
DROP COLUMN "actionType",
ADD COLUMN     "requestId" TEXT NOT NULL,
ADD COLUMN     "tweetId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "APIRequest" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionType" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "totalTweets" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "APIRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountMetrics" (
    "id" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyUsage" JSONB,

    CONSTRAINT "AccountMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountMetrics_account_key" ON "AccountMetrics"("account");

-- AddForeignKey
ALTER TABLE "TwitterAction" ADD CONSTRAINT "TwitterAction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "APIRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

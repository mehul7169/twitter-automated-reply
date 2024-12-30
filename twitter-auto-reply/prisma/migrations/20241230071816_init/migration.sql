-- CreateTable
CREATE TABLE "TwitterAction" (
    "id" TEXT NOT NULL,
    "tweetUrl" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "replyId" TEXT,
    "retweetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwitterAction_pkey" PRIMARY KEY ("id")
);

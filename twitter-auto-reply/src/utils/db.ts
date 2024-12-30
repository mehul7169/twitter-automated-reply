import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createAPIRequestWithActions(
  actionType: string,
  account: string,
  totalTweets: number,
  userAgent?: string,
  ipAddress?: string
) {
  return await prisma.apiRequest.create({
    data: {
      actionType,
      account,
      totalTweets,
      successCount: 0,
      errorCount: 0,
      userAgent,
      ipAddress,
    },
  });
}

export default prisma;

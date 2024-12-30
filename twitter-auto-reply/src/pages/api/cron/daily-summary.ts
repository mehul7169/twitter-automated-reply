import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../utils/db";
import { formatISO, subDays } from "date-fns";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const yesterday = subDays(new Date(), 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

    console.log(startOfDay, endOfDay);

    // Get all API requests for yesterday
    const apiRequests = await prisma.aPIRequest.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        actions: true,
      },
    });

    // Generate summary by account
    const accountSummaries = await Promise.all(
      Array.from(new Set(apiRequests.map((req) => req.account))).map(
        async (account) => {
          const accountRequests = apiRequests.filter(
            (req) => req.account === account
          );

          const totalRequests = accountRequests.length;
          const totalActions = accountRequests.reduce(
            (sum, req) => sum + req.totalTweets,
            0
          );
          const successfulActions = accountRequests.reduce(
            (sum, req) => sum + req.successCount,
            0
          );
          const failedActions = accountRequests.reduce(
            (sum, req) => sum + req.errorCount,
            0
          );

          // Update account metrics
          await prisma.accountMetrics.upsert({
            where: { account },
            create: {
              account,
              totalRequests,
              totalActions,
              successRate:
                totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
              dailyUsage: {
                [formatISO(yesterday, { representation: "date" })]: {
                  requests: totalRequests,
                  actions: totalActions,
                  successful: successfulActions,
                  failed: failedActions,
                },
              },
            },
            update: {
              totalRequests: { increment: totalRequests },
              totalActions: { increment: totalActions },
              successRate:
                totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
              dailyUsage: {
                [formatISO(yesterday, { representation: "date" })]: {
                  requests: totalRequests,
                  actions: totalActions,
                  successful: successfulActions,
                  failed: failedActions,
                },
              },
            },
          });

          return {
            account,
            totalRequests,
            totalActions,
            successfulActions,
            failedActions,
            successRate:
              totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
          };
        }
      )
    );

    // Generate overall summary
    const summary = {
      date: formatISO(yesterday, { representation: "date" }),
      totalRequests: apiRequests.length,
      totalActions: apiRequests.reduce((sum, req) => sum + req.totalTweets, 0),
      successfulActions: apiRequests.reduce(
        (sum, req) => sum + req.successCount,
        0
      ),
      failedActions: apiRequests.reduce((sum, req) => sum + req.errorCount, 0),
      accountSummaries,
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error generating daily summary:", error);
    res.status(500).json({ error: "Failed to generate daily summary" });
  }
}

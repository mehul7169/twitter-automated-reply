import type { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";
import formidable from "formidable";
import { ACCOUNTS_TO_ACCESS_TOKENS } from "../../utils/constants";
import prisma, { createAPIRequestWithActions } from "../../utils/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedData {
  tweet_urls: string;
  selected_account: keyof typeof ACCOUNTS_TO_ACCESS_TOKENS;
}

interface ResponseWithFlush extends NextApiResponse {
  flush?: () => void;
}

export default async function handler(
  req: NextApiRequest,
  res: ResponseWithFlush
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    const data = await parseForm(req);
    const urls = data.tweet_urls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    const accountCredentials = ACCOUNTS_TO_ACCESS_TOKENS[data.selected_account];

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: accountCredentials.accessToken!,
      accessSecret: accountCredentials.accessTokenSecret!,
    });

    const apiRequest = await createAPIRequestWithActions(
      "like",
      data.selected_account,
      urls.length,
      req.headers["user-agent"],
      req.headers["x-forwarded-for"] as string
    );

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const tweetId = url.split("/").pop()!;
      try {
        await client.v2.like(accountCredentials.userId!, tweetId);

        await prisma.twitterAction.create({
          data: {
            requestId: apiRequest.id,
            tweetUrl: url,
            tweetId,
            status: "success",
          },
        });

        await prisma.apiRequest.update({
          where: { id: apiRequest.id },
          data: { successCount: { increment: 1 } },
        });

        const result = {
          url,
          status: "success",
        };

        res.write(JSON.stringify(result) + "\n");
        if (res.flush) res.flush();
      } catch (error: any) {
        await prisma.twitterAction.create({
          data: {
            requestId: apiRequest.id,
            tweetUrl: url,
            tweetId,
            status: "error",
            message: error.message,
          },
        });

        await prisma.apiRequest.update({
          where: { id: apiRequest.id },
          data: { errorCount: { increment: 1 } },
        });

        const errorResult = {
          url,
          status: "error",
          message: error.message,
        };

        res.write(JSON.stringify(errorResult) + "\n");
        if (res.flush) res.flush();
      }
    }

    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
}

function parseForm(req: NextApiRequest): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const form = formidable({});

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);

      resolve({
        tweet_urls: (Array.isArray(fields.tweet_urls)
          ? fields.tweet_urls[0]
          : fields.tweet_urls || ""
        ).trim(),
        selected_account: (Array.isArray(fields.selected_account)
          ? fields.selected_account[0]
          : fields.selected_account || ""
        ).trim() as keyof typeof ACCOUNTS_TO_ACCESS_TOKENS,
      });
    });
  });
}

import { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";

dotenv.config();

// Initialize Twitter client
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

interface ReplyResult {
  url: string;
  status: "success" | "error";
  reply_id?: string;
  message?: string;
}

const extractTweetId = (url: string): string => {
  return url.split("/").pop()?.split("?")[0] || "";
};

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const processBatch = async (
  urls: string[],
  reply_message: string
): Promise<ReplyResult[]> => {
  const results: ReplyResult[] = [];

  for (const url of urls) {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) continue;

    try {
      const tweetId = extractTweetId(trimmedUrl);
      const response = await client.v2.tweet(reply_message, {
        reply: { in_reply_to_tweet_id: tweetId },
      });

      results.push({
        url: trimmedUrl,
        status: "success",
        reply_id: response.data.id,
      });
    } catch (error: any) {
      results.push({
        url: trimmedUrl,
        status: "error",
        message: error.message,
      });
    }
  }

  return results;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { tweet_urls, reply_message } = req.body;
    const urls = tweet_urls.split("\n").filter((url: string) => url.trim());
    const results: ReplyResult[] = [];

    // Process URLs in batches
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatch(batch, reply_message);
      results.push(...batchResults);

      // Add delay between batches if there are more URLs to process
      if (i + BATCH_SIZE < urls.length) {
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    return res.status(200).json({ results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

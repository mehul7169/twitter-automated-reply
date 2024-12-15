import type { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";
import formidable from "formidable";
import fs from "fs";
import { ACCOUNTS_TO_ACCESS_TOKENS } from "../../utils/constants";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedData {
  tweet_urls: string;
  reply_message: string;
  selected_account: keyof typeof ACCOUNTS_TO_ACCESS_TOKENS;
  media?: formidable.File[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await parseForm(req);
    // Clean up URLs, removing any whitespace or hidden characters
    const urls = data.tweet_urls
      .split("\n")
      .map((url) => url.trim())
      .filter(
        (url) =>
          url &&
          url.match(
            /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+$/
          )
      );
    const selectedAccount = data.selected_account;

    // Get credentials for selected account
    const accountCredentials = ACCOUNTS_TO_ACCESS_TOKENS[selectedAccount];

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: accountCredentials.accessToken!,
      accessSecret: accountCredentials.accessTokenSecret!,
    });

    const results: {
      url: string;
      status: string;
      reply_id?: string;
      message?: string;
    }[] = [];

    const v2Client = client.v2;

    // Upload media first if present
    let mediaIds: string[] = [];
    if (data.media && data.media.length > 0) {
      const mediaPromises = data.media.map(async (file) => {
        const mediaBuffer = fs.readFileSync(file.filepath);
        return await client.v1.uploadMedia(mediaBuffer, {
          mimeType: file.mimetype || undefined,
        });
      });

      mediaIds = await Promise.all(mediaPromises);
    }

    // Process URLs in reverse order
    const reversedUrls = [...urls].reverse();

    for (let i = 0; i < reversedUrls.length; i++) {
      const url = reversedUrls[i];

      // Reduced delay between tweets
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Reduced from 10s to 3s
      }

      try {
        // Clean up the tweet ID - remove any whitespace or hidden characters
        const tweetId = url.split("/").pop()!.trim();
        let retries = 3;

        while (retries > 0) {
          try {
            console.log(
              `Attempting to reply to tweet ${url} (Attempt ${4 - retries}/3)`
            );

            // Clean up the reply message
            const cleanMessage = data.reply_message.trim();

            const reply = await v2Client.reply(cleanMessage, tweetId, {
              media:
                mediaIds.length > 0
                  ? {
                      media_ids: mediaIds.slice(0, 4) as
                        | [string]
                        | [string, string]
                        | [string, string, string]
                        | [string, string, string, string],
                    }
                  : undefined,
            });

            results.push({
              url,
              status: "success",
              reply_id: reply.data.id,
            });
            console.log(`Successfully replied to tweet: ${url}`);

            // Reduced delay after successful reply
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Reduced from 5s to 2s
            break;
          } catch (error: any) {
            console.error(
              `Attempt ${4 - retries}/3 failed for tweet ${url}:`,
              error.code,
              error.message,
              error.data || ""
            );

            if ((error.code === 503 || error.code === 429) && retries > 1) {
              retries--;
              const backoffTime = (4 - retries) * 5000; // Reduced from 8s to 5s base
              console.log(`Waiting ${backoffTime / 1000}s before retry...`);
              await new Promise((resolve) => setTimeout(resolve, backoffTime));
              continue;
            }
            throw error;
          }
        }
      } catch (error: any) {
        console.error(`Final error processing tweet ${url}:`, {
          code: error.code,
          message: error.message,
          data: error.data || "",
          stack: error.stack,
        });

        results.push({
          url,
          status: "error",
          message:
            error.code === 503
              ? `Twitter service unavailable: ${error.message}`
              : error.code === 429
              ? `Rate limit exceeded: ${error.message}`
              : error.message || "Failed to send reply",
        });
      }
    }

    // Clean up uploaded files
    if (data.media) {
      data.media.forEach((file) => {
        try {
          fs.unlinkSync(file.filepath);
        } catch (error) {
          console.error("Error cleaning up file:", error);
        }
      });
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
}

function parseForm(req: NextApiRequest): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFiles: 4,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);

      resolve({
        tweet_urls: (Array.isArray(fields.tweet_urls)
          ? fields.tweet_urls[0]
          : fields.tweet_urls || ""
        ).trim(),
        reply_message: (Array.isArray(fields.reply_message)
          ? fields.reply_message[0]
          : fields.reply_message || ""
        ).trim(),
        selected_account: (Array.isArray(fields.selected_account)
          ? fields.selected_account[0].trim()
          : fields.selected_account?.trim() ||
            "") as keyof typeof ACCOUNTS_TO_ACCESS_TOKENS,
        media: Array.isArray(files.media)
          ? files.media
          : files.media
          ? [files.media]
          : undefined,
      });
    });
  });
}

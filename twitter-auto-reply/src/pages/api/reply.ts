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
    const urls = data.tweet_urls.split("\n").filter(Boolean);
    const selectedAccount = data.selected_account;

    // Get credentials for selected account
    const accountCredentials = ACCOUNTS_TO_ACCESS_TOKENS[selectedAccount];

    console.log(accountCredentials);

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

    for (const url of urls) {
      try {
        const tweetId = url.split("/").pop()!;
        let mediaIds: string[] = [];

        // Process media if present
        if (data.media && data.media.length > 0) {
          const mediaPromises = data.media.map(async (file) => {
            const mediaBuffer = fs.readFileSync(file.filepath);
            const mediaResponse = await client.v1.uploadMedia(mediaBuffer, {
              mimeType: file.mimetype || undefined,
            });
            return mediaResponse;
          });

          mediaIds = await Promise.all(mediaPromises);
        }

        // Send the reply
        const reply = await v2Client.reply(data.reply_message, tweetId, {
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
      } catch (error: any) {
        results.push({
          url,
          status: "error",
          message: error.message || "Failed to send reply",
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

    form.parse(req, (err, fields: formidable.Fields, files) => {
      if (err) reject(err);

      const tweet_urls = fields.tweet_urls as string | string[] | undefined;
      const reply_message = fields.reply_message as
        | string
        | string[]
        | undefined;
      const selected_account = fields.selected_account as
        | string
        | string[]
        | undefined;

      resolve({
        tweet_urls: Array.isArray(tweet_urls)
          ? tweet_urls[0]
          : tweet_urls || "",
        reply_message: Array.isArray(reply_message)
          ? reply_message[0]
          : reply_message || "",
        selected_account: (Array.isArray(selected_account)
          ? selected_account[0]
          : selected_account || "") as keyof typeof ACCOUNTS_TO_ACCESS_TOKENS,
        media: Array.isArray(files.media)
          ? files.media
          : files.media
          ? [files.media]
          : undefined,
      });
    });
  });
}

import type { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";
import formidable from "formidable";
import fs from "fs";
import {
  ACCOUNTS_TO_ACCESS_TOKENS,
  YASHRAJ_ACCOUNT_ACCESS_TOKENS,
} from "../../utils/constants";
import prisma from "../../utils/db";
import { createAPIRequestWithActions } from "../../utils/db";

// Extend NextApiResponse to include flush
interface ResponseWithFlush extends NextApiResponse {
  flush?: () => void;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedData {
  tweet_urls: string;
  reply_message: string;
  selected_account:
    | keyof typeof ACCOUNTS_TO_ACCESS_TOKENS
    | keyof typeof YASHRAJ_ACCOUNT_ACCESS_TOKENS;
  media?: formidable.File[];
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
    // Clean up URLs, removing any whitespace or hidden characters
    const urls = data.tweet_urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => {
        const isValid =
          url &&
          url.match(
            /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/(status|statuses)\/[0-9]+$/
          );
        console.log("URL validation:", { url, isValid }); // Debug log
        return isValid;
      });

    console.log("Filtered URLs:", urls); // Debug log

    const selectedAccount = data.selected_account;

    console.log("selectedAccount: ", selectedAccount);

    // Check which account collection contains the selected account
    const isYashrajAccount = selectedAccount in YASHRAJ_ACCOUNT_ACCESS_TOKENS;

    // Get credentials based on account type
    const accountCredentials = isYashrajAccount
      ? YASHRAJ_ACCOUNT_ACCESS_TOKENS[
          selectedAccount as keyof typeof YASHRAJ_ACCOUNT_ACCESS_TOKENS
        ]
      : ACCOUNTS_TO_ACCESS_TOKENS[
          selectedAccount as keyof typeof ACCOUNTS_TO_ACCESS_TOKENS
        ];

    // Create client with appropriate API keys
    const client = new TwitterApi({
      appKey: isYashrajAccount
        ? process.env.TWITTER_YASHRAJ_API_KEY!
        : process.env.TWITTER_API_KEY!,
      appSecret: isYashrajAccount
        ? process.env.TWITTER_YASHRAJ_API_SECRET!
        : process.env.TWITTER_API_SECRET!,
      accessToken: accountCredentials.accessToken!,
      accessSecret: accountCredentials.accessTokenSecret!,
    });

    console.log("client: ", client);

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

    console.log("starting twitter process");

    console.log(urls);

    const apiRequest = await createAPIRequestWithActions(
      "comment",
      selectedAccount,
      urls.length,
      req.headers["user-agent"],
      req.headers["x-forwarded-for"] as string
    );

    // Process each URL
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const tweetId = url.split("/").pop()!;
      console.log("url: ", url);
      console.log(
        `[Tweet ${i + 1}/${urls.length}] Attempting to reply to: ${url}`
      );
      try {
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

        const result = {
          url,
          status: "success",
          reply_id: reply.data.id,
        };

        // Log to database
        await prisma.twitterAction.create({
          data: {
            requestId: apiRequest.id,
            tweetUrl: url,
            tweetId,
            status: "success",
            replyId: reply.data.id,
          },
        });

        await prisma.aPIRequest.update({
          where: { id: apiRequest.id },
          data: { successCount: { increment: 1 } },
        });

        // Write and flush each result immediately
        res.write(JSON.stringify(result) + "\n");
        if (res.flush) {
          res.flush();
        }

        console.log(
          `[Tweet ${i + 1}/${urls.length}] Successfully replied to: ${url}`
        );

        if (i < urls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.error(
          `[Tweet ${i + 1}/${urls.length}] Error processing tweet ${url}:`,
          error
        );

        const errorResult = {
          url,
          status: "error",
          message: error.message || "Failed to send reply",
        };

        // Write and flush error results immediately too
        res.write(JSON.stringify(errorResult) + "\n");
        if (res.flush) {
          res.flush();
        }

        // Log to database
        await prisma.twitterAction.create({
          data: {
            requestId: apiRequest.id,
            tweetUrl: url,
            tweetId,
            status: "error",
            message: error.message,
          },
        });

        await prisma.aPIRequest.update({
          where: { id: apiRequest.id },
          data: { errorCount: { increment: 1 } },
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

    res.end(); // End the response stream
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

      const selectedAccount = Array.isArray(fields.selected_account)
        ? String(fields.selected_account[0]).trim()
        : String(fields.selected_account || "").trim();

      resolve({
        tweet_urls: (Array.isArray(fields.tweet_urls)
          ? fields.tweet_urls[0]
          : fields.tweet_urls || ""
        ).trim(),
        reply_message: (Array.isArray(fields.reply_message)
          ? fields.reply_message[0]
          : fields.reply_message || ""
        ).trim(),
        selected_account:
          selectedAccount as keyof typeof ACCOUNTS_TO_ACCESS_TOKENS,
        media: Array.isArray(files.media)
          ? files.media
          : files.media
          ? [files.media]
          : undefined,
      });
    });
  });
}

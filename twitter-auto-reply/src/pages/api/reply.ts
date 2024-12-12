import { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

const parseForm = async (req: NextApiRequest) => {
  const form = formidable({});
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

const uploadMedia = async (filePath: string, mimeType: string) => {
  const mediaBuffer = fs.readFileSync(filePath);
  return await client.v1.uploadMedia(mediaBuffer, { mimeType });
};

const extractTweetId = (url: string): string => {
  return url.split("/").pop()?.split("?")[0] || "";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);
    console.log("Parsed form data:", { fields, files });

    const tweet_urls = fields.tweet_urls[0];
    const reply_message = fields.reply_message[0];

    const urls = tweet_urls.split("\n").filter((url: string) => url.trim());
    console.log("Processing URLs:", urls);

    const results = [];

    // Upload media files if any
    const mediaIds: string[] = [];
    if (files.media) {
      console.log("Processing media files");
      const mediaFiles = Array.isArray(files.media)
        ? files.media
        : [files.media];
      for (const file of mediaFiles.slice(0, 4)) {
        try {
          const mediaId = await uploadMedia(file.filepath, file.mimetype);
          mediaIds.push(mediaId);
          console.log("Uploaded media:", { mediaId, file: file.filepath });
        } catch (error) {
          console.error("Media upload error:", error);
        }
      }
    }

    // Process each URL
    for (const url of urls) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;

      try {
        const tweetId = extractTweetId(trimmedUrl);
        console.log("Replying to tweet:", { tweetId, reply_message });

        const response = await client.v2.tweet(reply_message, {
          reply: { in_reply_to_tweet_id: tweetId },
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
          url: trimmedUrl,
          status: "success",
          reply_id: response.data.id,
        });
      } catch (error: any) {
        console.error("Tweet reply error:", error);
        results.push({
          url: trimmedUrl,
          status: "error",
          message: error.message,
        });
      }
    }

    return res.status(200).json({ results });
  } catch (error: any) {
    console.error("API handler error:", error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

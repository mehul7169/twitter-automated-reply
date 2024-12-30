export const ACCOUNTS_TO_ACCESS_TOKENS = {
  mehul: {
    userHandle: "mehul",
    userId: "1141978754815672321",
    accessToken: process.env.TWITTER_MEHUL_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_MEHUL_ACCESS_TOKEN_SECRET,
  },
  yashraj: {
    userHandle: "yashraj",
    userId: "1818655003747532804",
    accessToken: process.env.TWITTER_YASHRAJ_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_YASHRAJ_ACCESS_TOKEN_SECRET,
  },
  bot: {
    userHandle: "bot",
    userId: "1867774732306726912",
    accessToken: process.env.TWITTER_BOT_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_BOT_ACCESS_TOKEN_SECRET,
  },
  mr_shadow: {
    userHandle: "Rahul Shadow",
    userId: "1809578700431847424",
    accessToken: process.env.TWITTER_MR_SHADOW_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_MR_SHADOW_ACCESS_TOKEN_SECRET,
  },
  BakaitAlways: {
    userHandle: "Bakait",
    userId: "1808836289556590595",
    accessToken: process.env.TWITTER_BAKAIT_ALWAYS_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_BAKAIT_ALWAYS_ACCESS_TOKEN_SECRET,
  },
  RahulMirro89386: {
    userHandle: "Rahul Mirror",
    userId: "1808836289556590595",
    accessToken: process.env.TWITTER_RAHUL_MIRRO_89386_ACCESS_TOKEN,
    accessTokenSecret:
      process.env.TWITTER_RAHUL_MIRRO_89386_ACCESS_TOKEN_SECRET,
  },
  RightWingers00: {
    userHandle: "Right Wingers",
    userId: "1808836289556590595",
    accessToken: process.env.TWITTER_RIGHT_WINGERS_00_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_RIGHT_WINGERS_00_ACCESS_TOKEN_SECRET,
  },
};

export const YASHRAJ_ACCOUNT_ACCESS_TOKENS = {
  YashrajJ79015: {
    userHandle: "Railwaysisbest",
    userId: "1808836289556590595",
    accessToken: process.env.TWITTER_YASHRAJ_YASHRAJ_J_79015_ACCESS_TOKEN,
    accessTokenSecret:
      process.env.TWITTER_YASHRAJ_YASHRAJ_J_79015_ACCESS_TOKEN_SECRET,
  },
  yashraj_mehul: {
    userHandle: "Mehul Agarwal",
    userId: "1141978754815672321",
    accessToken: process.env.TWITTER_YASHRAJ_MEHUL_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_YASHRAJ_MEHUL_ACCESS_TOKEN_SECRET,
  },
};

export type ActionType = "comment" | "like" | "retweet";

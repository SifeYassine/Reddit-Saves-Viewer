import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  url: text("url").primaryKey(),
  author: text("author"),
  title: text("title"),
  subreddit: text("subreddit"),
  content: text("content"),
  media_links: text("media_links").default("[]"),
  created_at: integer("created_at"),
});

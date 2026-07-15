import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { count, inArray } from "drizzle-orm";
import { posts as postsTable } from "./schema.js";

const baseDir = import.meta.dirname;
export const dbPath = path.join(baseDir, "cache.db");

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Get all cached posts
export function getPosts(urls) {
  const posts = db.select().from(postsTable).where(inArray(postsTable.url, urls)).all();
  return new Map(posts.map((post) => [post.url, { ...post, media_links: JSON.parse(post.media_links) }]));
}

// Insert posts into the cache database
export function insertPosts(posts) {
  const postsToInsert = posts.map((post) => ({ ...post, media_links: JSON.stringify(post.media_links) }));
  db.insert(postsTable).values(postsToInsert).onConflictDoNothing().run();
}

// Get posts count
export function getPostsCount() {
  return db.select({ count: count() }).from(postsTable).get().count;
}

// Clear cache
export function deletePosts() {
  db.delete(postsTable).run();
}

// Close database connection
export function closeDb() {
  sqlite.close();
}

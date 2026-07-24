import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import path from "path";
import { fetchBatchFromReddit } from "./reddit.js";
import { getPosts, insertPosts, getPostsCount, deletePosts, closeDb, dbPath } from "./cache.js";

const baseDir = import.meta.dirname;
const rootPath = path.join(baseDir, "..", "public");
const BATCH_SIZE = 60;

// Initialize Fastify server instance
const fastify = Fastify({ logger: true });
// Register CORS
await fastify.register(fastifyCors, { origin: process.env.CLIENT_URL });
await fastify.register(fastifyStatic, { root: rootPath, prefix: "/public/" });

// Fetch posts with Batching & Caching
fastify.post("/api/fetch-posts", async (request) => {
  try {
    const { urls } = request.body;

    request.log.info(`\n=== Fetching ${urls.length} posts ===`);

    const cachedMap = getPosts(urls);
    const postMap = new Map();
    const missingUrls = [];

    // Check cache for all URLs (fast & synchronous)
    for (const url of urls) {
      if (cachedMap.has(url)) {
        request.log.info(`Cache HIT: ${url}`);
        postMap.set(url, cachedMap.get(url));
      } else {
        request.log.info(`Cache MISS: ${url}`);
        missingUrls.push(url);
      }
    }

    request.log.info(`Cache: ${postMap.size} hits, ${missingUrls.length} misses`);

    // Fetch missing posts in batches
    if (missingUrls.length > 0) {
      // Split into batches (60 by default)
      for (let i = 0; i < missingUrls.length; i += BATCH_SIZE) {
        const batch = missingUrls.slice(i, i + BATCH_SIZE);
        request.log.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} URLs)`);

        const batchPosts = await fetchBatchFromReddit(batch);

        if (batchPosts.length > 0) {
          insertPosts(batchPosts);
        }

        for (const post of batchPosts) {
          postMap.set(post.url, post);
        }
      }
    }

    // Return posts in the exact order requested
    const orderedPosts = urls.map((url) => postMap.get(url)).filter(Boolean);

    request.log.info(`Returning ${orderedPosts.length} posts total\n`);

    return { posts: orderedPosts };
  } catch (error) {
    request.log.error(error);
    throw error;
  }
});

// Get cache statistics
fastify.get("/api/cache-stats", async () => {
  try {
    const count = getPostsCount();
    return { cachedPosts: count };
  } catch (error) {
    throw error;
  }
});

// Clear cache
fastify.delete("/api/cache", async () => {
  try {
    deletePosts();
    return { message: "Cache cleared successfully" };
  } catch (error) {
    throw error;
  }
});

// Server Lifecycle
async function start() {
  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info(`SQLite cache initialized at: ${path.join(baseDir, "cache.db")}`);
    fastify.log.info(`Batch size: ${BATCH_SIZE} posts per request`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  fastify.log.info(`Received ${signal}, closing server...`);
  await fastify.close();
  closeDb();
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

start();

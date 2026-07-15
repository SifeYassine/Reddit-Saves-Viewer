import axios from "axios";

const DELAY_BTW_REQUESTS = 1000;
const MAX_RETRIES = 3;

const rateLimit = { remaining: 1000, resetTime: Date.now() };

// Extract media links
function extractMediaLinks(mediaData) {
  if (!mediaData) {
    return [];
  }

  return Object.entries(mediaData).map(([key, item]) => {
    const extension = item?.m?.split("/")[1] || "jpg";
    return `https://i.redd.it/${key}.${extension}`;
  });
}

// Extract video media links
function extractVideoMediaLinks(postData, url) {
  const fallbackUrl = postData.media?.reddit_video?.fallback_url || postData.secure_media?.reddit_video?.fallback_url;

  return [fallbackUrl ?? `${url}/DASH_480.mp4`];
}

// Extract Redgifs media links
function extractRedgifsMediaLinks(postData, url) {
  const embedUrl = postData?.secure_media_embed?.media_domain_url;

  if (embedUrl) {
    return [embedUrl];
  }

  const fallbackUrl = postData?.preview?.reddit_video_preview?.fallback_url;

  // Fallbacks if secure_media_embed is missing
  if (fallbackUrl) {
    return [fallbackUrl];
  }

  return [url.replace("/watch/", "/ifr/")];
}

// Archive media links
function buildArchiveOrgMediaLinks(url) {
  const isGifv = url.match(/\.gifv$/i);

  if (isGifv) {
    return [`https://web.archive.org/web/${url.replace(".gifv", ".mp4")}`];
  }

  return [`https://web.archive.org/web/${url}`];
}

// Determine media type
function determineMediaType(postData) {
  const { url, is_video, media_metadata, crosspost_parent_list } = postData;

  if (crosspost_parent_list?.[0]) return "crosspost";
  if (is_video) return "video";
  if (url?.includes("redgifs.com")) return "redgifs";
  if (url?.includes("imgur.com") || url?.includes("gfycat.com")) return "archive";
  if (media_metadata) return "gallery";
  if (url) return "direct";

  return "none";
}

// Resolve media links
function resolveMediaLinks(postData) {
  const { url, media_metadata, crosspost_parent_list } = postData;
  const mediaType = determineMediaType(postData);

  switch (mediaType) {
    case "crosspost":
      return resolveMediaLinks(crosspost_parent_list[0]);

    case "video":
      return extractVideoMediaLinks(postData, url);

    case "redgifs":
      return extractRedgifsMediaLinks(postData, url);

    case "archive":
      return buildArchiveOrgMediaLinks(url);

    case "gallery":
      return extractMediaLinks(media_metadata);

    case "direct":
      return [url];

    default:
      return [];
  }
}

// Format post data directly from the post object
function formatPostData(postData, url) {
  if (!postData) {
    return null;
  }

  const { author, title, subreddit, selftext, created_utc } = postData;

  return {
    url,
    author,
    title,
    subreddit,
    content: selftext || "",
    media_links: resolveMediaLinks(postData),
    created_at: created_utc,
  };
}

// Apply rate limit
async function applyRateLimit(headers) {
  const remaining = parseInt(headers["x-ratelimit-remaining"] ?? "1000", 10);
  const reset = parseInt(headers["x-ratelimit-reset"] ?? "0", 10);

  rateLimit.remaining = remaining;
  rateLimit.resetTime = Date.now() + reset * 1000;

  if (remaining < 5 && reset > 0) {
    const waitTime = Math.min(reset * 1000, 60000);
    console.info(`Rate limit low (${remaining}). Waiting ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}

// Wait for rate limit
async function waitForRateLimit() {
  const now = Date.now();

  if (rateLimit.remaining < 2 && now < rateLimit.resetTime) {
    const waitTime = rateLimit.resetTime - now;
    console.info(`Rate limit reached. Waiting ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  await new Promise((resolve) => setTimeout(resolve, DELAY_BTW_REQUESTS));
}

// Fetch multiple posts in a single batch request
export async function fetchBatchFromReddit(urls, retries = MAX_RETRIES) {
  await waitForRateLimit();

  // Map URLs to Reddit's "t3_" Id format
  const idMap = new Map();
  const postIds = [];

  for (const url of urls) {
    const match = url.match(/\/comments\/([^/]+)/);
    if (match) {
      const id = match[1];
      idMap.set(id, url); // Map: Id -> URL
      postIds.push(`t3_${id}`);
    }
  }

  if (postIds.length === 0) {
    return [];
  }

  try {
    console.info(`Batch fetching ${postIds.length} posts from Reddit...`);

    const headers = { Cookie: `reddit_session=${process.env.REDDIT_COOKIE}` };

    // Fetch batch posts in one API call
    const response = await axios.get("https://www.reddit.com/api/info.json", {
      headers,
      params: { id: postIds.join(",") },
    });

    await applyRateLimit(response.headers);

    const children = response.data?.data?.children ?? [];

    return children.map((child) => {
      const data = child.data;
      const url = idMap.get(data.id);
      return formatPostData(data, url);
    });
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      await applyRateLimit(error.response.headers);
      return await fetchBatchFromReddit(urls, retries - 1);
    }

    console.error(`Error fetching batch: ${error.message}`);
    return [];
  }
}

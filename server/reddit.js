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

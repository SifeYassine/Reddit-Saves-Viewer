import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MediaCarousel } from "@/components/MediaCarousel";
import { MediaItem } from "@/components/MediaItem";
import { ExternalLink } from "lucide-react";

export function PostCard({ post }) {
  if (!post) {
    return null;
  }

  const validMediaLinks = post.media_links?.filter((link) => {
    if (!link) {
      return false;
    }

    const media = link.match(/\.(mp4|png|jpg|jpeg|jfif|webp|gif|gifv)$/);
    const redgif = link.includes("redgifs.com/ifr");

    return media || redgif;
  });

  return (
    <Card className="masonry-item overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="group">
          <CardTitle className="text-base font-semibold leading-snug line-clamp-3 group-hover:text-primary transition-colors">
            {post.title}
            <ExternalLink
              className="inline-block ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              size={14}
            />
          </CardTitle>
        </a>

        {/* Author & Subreddit */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
          <a
            href={`https://www.reddit.com/user/${post.author}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors font-medium"
          >
            u/{post.author}
          </a>
          <span>·</span>
          <a
            href={`https://www.reddit.com/r/${post.subreddit}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors font-medium"
          >
            r/{post.subreddit}
          </a>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Text content */}
        {post.content?.trim() && (
          <p className="text-sm text-muted-foreground line-clamp-5 leading-relaxed">{post.content}</p>
        )}

        {/* Media */}
        {validMediaLinks?.length === 1 && (
          <div className="rounded-md overflow-hidden bg-black">
            <MediaItem link={validMediaLinks[0]} />
          </div>
        )}

        {/* Media Carousel */}
        {validMediaLinks?.length > 1 && <MediaCarousel mediaLinks={validMediaLinks} />}
      </CardContent>
    </Card>
  );
}

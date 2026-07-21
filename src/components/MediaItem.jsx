import { VideoPlayer } from "@/components/ui/video-player";

export function MediaItem({ link }) {
  if (!link) {
    return null;
  }

  const video = link.match(/\.mp4$/);
  const image = link.match(/\.(png|jpg|jpeg|jfif|webp|gif|gifv)$/);
  const redgif = link.includes("redgifs.com/ifr");

  if (video) {
    return <VideoPlayer src={link} muted className="w-full h-full object-contain" />;
  }

  if (image) {
    return (
      <img
        src={link}
        alt="Post media"
        loading="lazy"
        className="w-full h-full object-contain"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Available";
        }}
      />
    );
  }

  if (redgif) {
    return <iframe src={link} allowFullScreen className="w-full h-full border-0" />;
  }

  return null;
}

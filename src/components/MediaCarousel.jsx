import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@/components/MediaItem";

export function MediaCarousel({ mediaLinks }) {
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Carousel setApi={setApi} className="rounded-md overflow-hidden bg-black">
        <CarouselContent>
          {mediaLinks.map((link, index) => (
            <CarouselItem key={index}>
              <MediaItem link={link} />
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-3" />
        <CarouselNext className="right-3" />

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
          {mediaLinks.map((_, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={`h-2 rounded-full p-0 transition-all ${
                index === current ? "w-5 bg-white hover:bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                api?.scrollTo(index);
              }}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}

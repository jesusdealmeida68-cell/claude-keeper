import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const BANNERS = [
  "/banners/banner-1.jpg",
  "/banners/banner-2.jpg",
  "/banners/banner-3.jpg",
  "/banners/banner-4.jpg",
  "/banners/banner-5.jpg",
  "/banners/banner-6.png",
  "/banners/banner-7.png",
];

export function PromoBanners() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const timer = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [api]);

  return (
    <div className="w-full">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent className="-ml-0">
          {BANNERS.map((src, i) => (
            <CarouselItem key={src} className="basis-full pl-0">
              <div className="overflow-hidden rounded-3xl shadow-card">
                <img
                  src={src}
                  alt={`Promoção ${i + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="mt-3 flex justify-center gap-1.5">
        {BANNERS.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Ir para o banner ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              current === i ? "w-5 bg-gold" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

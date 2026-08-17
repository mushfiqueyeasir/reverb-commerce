"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PREVIEW_VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  phone: { width: 390, height: 844 },
} as const;

type PreviewViewport = keyof typeof PREVIEW_VIEWPORTS;

export function ScaledThemePreview({
  viewport,
  src,
  title,
  loading,
  interactive = true,
  className,
}: {
  viewport: PreviewViewport;
  src: string;
  title: string;
  loading?: "eager" | "lazy";
  interactive?: boolean;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const dimensions = PREVIEW_VIEWPORTS[viewport];

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateScale = (width: number) => {
      if (!Number.isFinite(width) || width <= 0) {
        setScale(null);
        return;
      }

      setScale(width / dimensions.width);
    };

    updateScale(wrapper.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) updateScale(entry.contentRect.width);
    });
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, [dimensions.width]);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full overflow-hidden bg-[#050505]", className)}
      style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
    >
      <iframe
        title={title}
        src={src}
        tabIndex={-1}
        loading={loading}
        aria-hidden={interactive ? undefined : true}
        className={cn(
          "absolute left-0 top-0 origin-top-left border-0 bg-[#050505]",
          !interactive && "pointer-events-none",
          scale === null && "invisible",
        )}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          transform: `scale(${scale ?? 0})`,
        }}
      />
    </div>
  );
}

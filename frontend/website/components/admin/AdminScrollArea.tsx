"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminScrollArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startScrollTop: number;
  } | null>(null);

  const syncThumb = useCallback(() => {
    frameRef.current = 0;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !track || !thumb) return;

    const maxScroll = Math.max(
      0,
      viewport.scrollHeight - viewport.clientHeight,
    );
    const canScroll = maxScroll > 1;
    track.style.opacity = canScroll ? "1" : "0";
    track.style.pointerEvents = canScroll ? "auto" : "none";

    if (!canScroll) {
      thumb.style.height = "0px";
      thumb.style.transform = "translate3d(0,0,0)";
      return;
    }

    const trackHeight = Math.max(0, track.clientHeight - 2);
    const thumbHeight = Math.max(
      24,
      (viewport.clientHeight / viewport.scrollHeight) * trackHeight,
    );
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const ratio = viewport.scrollTop / maxScroll;

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translate3d(0, ${ratio * maxThumbTop}px, 0)`;
  }, []);

  const scheduleSync = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(syncThumb);
  }, [syncThumb]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    scheduleSync();
    viewport.addEventListener("scroll", scheduleSync, { passive: true });

    const observer = new ResizeObserver(scheduleSync);
    observer.observe(viewport);
    observer.observe(content);

    return () => {
      viewport.removeEventListener("scroll", scheduleSync);
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [scheduleSync]);

  const scrollFromPointer = (clientY: number) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !track || !thumb) return;

    const rect = track.getBoundingClientRect();
    const trackHeight = Math.max(0, track.clientHeight - 2);
    const thumbHeight = thumb.offsetHeight || 24;
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const y = clientY - rect.top - 1 - thumbHeight / 2;
    const ratio =
      maxThumbTop > 0 ? Math.min(1, Math.max(0, y / maxThumbTop)) : 0;
    const maxScroll = Math.max(
      0,
      viewport.scrollHeight - viewport.clientHeight,
    );
    viewport.scrollTop = ratio * maxScroll;
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        ref={viewportRef}
        className="scrollbar-hide size-full overflow-y-auto overscroll-contain"
      >
        <div ref={contentRef} className="min-w-full">
          {children}
        </div>
      </div>

      <div
        ref={trackRef}
        aria-hidden="true"
        className="absolute inset-y-0 right-0 z-10 w-2.5 touch-none select-none opacity-0 transition-opacity"
        style={{ pointerEvents: "none" }}
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          scrollFromPointer(event.clientY);
          scheduleSync();
        }}
      >
        <div
          ref={thumbRef}
          className="absolute right-px top-px w-2 cursor-pointer rounded-full bg-foreground/15 transition-colors will-change-transform hover:bg-foreground/30"
          style={{ height: 0, transform: "translate3d(0,0,0)" }}
          onPointerDown={(event) => {
            const viewport = viewportRef.current;
            if (!viewport) return;
            event.preventDefault();
            event.stopPropagation();
            dragRef.current = {
              pointerId: event.pointerId,
              startY: event.clientY,
              startScrollTop: viewport.scrollTop,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            const viewport = viewportRef.current;
            const track = trackRef.current;
            const thumb = thumbRef.current;
            if (
              !drag ||
              drag.pointerId !== event.pointerId ||
              !viewport ||
              !track ||
              !thumb
            ) {
              return;
            }

            const maxThumbTop = Math.max(
              0,
              track.clientHeight - 2 - thumb.offsetHeight,
            );
            const maxScroll = Math.max(
              0,
              viewport.scrollHeight - viewport.clientHeight,
            );
            if (maxThumbTop <= 0 || maxScroll <= 0) return;

            viewport.scrollTop = Math.min(
              maxScroll,
              Math.max(
                0,
                drag.startScrollTop +
                  ((event.clientY - drag.startY) / maxThumbTop) * maxScroll,
              ),
            );
          }}
          onPointerUp={(event) => {
            if (dragRef.current?.pointerId === event.pointerId) {
              dragRef.current = null;
            }
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        />
      </div>
    </div>
  );
}

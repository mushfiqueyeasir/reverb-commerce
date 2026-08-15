"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const AUTO_SCROLL_SPEED = 40;

export function useMarqueeCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startScroll: number } | null>(
    null,
  );
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());
  const autoScroll = !hovering && !dragging && !reduceMotion;

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !autoScroll) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const elapsed = (now - last) / 1000;
      last = now;
      const half = el.scrollWidth / 2;
      el.scrollLeft = (el.scrollLeft + AUTO_SCROLL_SPEED * elapsed) % half;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [autoScroll]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = {
      startX: event.clientX,
      startScroll: trackRef.current?.scrollLeft ?? 0,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    const el = trackRef.current;
    if (!drag || !el) return;
    el.scrollLeft = drag.startScroll - (event.clientX - drag.startX);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return {
    trackRef,
    handlePointerDown,
    handlePointerMove,
    endDrag,
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => setHovering(false),
  };
}
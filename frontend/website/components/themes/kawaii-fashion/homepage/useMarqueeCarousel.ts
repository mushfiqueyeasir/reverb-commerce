"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const AUTO_SCROLL_SPEED = 40;
const DRAG_THRESHOLD = 5;

export function useMarqueeCarousel(copies = 2) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragState = useRef<{
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());
  const autoScroll = !hovering && !dragging && !reduceMotion;

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !autoScroll) return;
    if (el.scrollWidth <= el.clientWidth) return;
    const stepWidth = el.scrollWidth / copies;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      if (draggingRef.current) {
        cancelAnimationFrame(frame);
        return;
      }
      const elapsed = (now - last) / 1000;
      last = now;
      let next = el.scrollLeft + AUTO_SCROLL_SPEED * elapsed;
      if (next >= stepWidth) next -= stepWidth;
      el.scrollLeft = next;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [autoScroll, copies]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent) => {
      const drag = dragState.current;
      const el = trackRef.current;
      if (!drag || !el) return;
      const dx = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD) {
        drag.moved = true;
        suppressClickRef.current = true;
      }
      if (drag.moved) {
        el.scrollLeft = drag.startScroll - dx;
      }
    };
    const onEnd = () => {
      draggingRef.current = false;
      dragState.current = null;
      setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [dragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    suppressClickRef.current = false;
    draggingRef.current = true;
    dragState.current = {
      startX: event.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    setDragging(true);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  return {
    trackRef,
    handlePointerDown,
    handleClickCapture,
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => setHovering(false),
  };
}
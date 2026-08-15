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
    lastX: number;
    lastAt: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const momentumFrameRef = useRef(0);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());
  const autoScroll = !hovering && !dragging && !settling && !reduceMotion;

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
        const now = performance.now();
        const elapsed = Math.max(1, now - drag.lastAt);
        drag.velocity = -(event.clientX - drag.lastX) / elapsed;
        drag.lastX = event.clientX;
        drag.lastAt = now;
        el.scrollLeft = drag.startScroll - dx;
      }
    };
    const onEnd = () => {
      const drag = dragState.current;
      const el = trackRef.current;
      draggingRef.current = false;
      dragState.current = null;
      setDragging(false);
      if (!drag?.moved || !el || reduceMotion) return;

      let position = el.scrollLeft;
      let velocity = drag.velocity * 1000;
      const limit = Math.max(0, el.scrollWidth - el.clientWidth);
      const target = Math.min(limit, Math.max(0, position + velocity * 0.24));
      let previous = performance.now();
      setSettling(true);

      const settle = (now: number) => {
        const elapsed = Math.min(0.032, (now - previous) / 1000);
        previous = now;
        const acceleration = (target - position) * 150 - velocity * 24;
        velocity += acceleration * elapsed;
        position += velocity * elapsed;
        el.scrollLeft = position;
        if (Math.abs(target - position) < 0.5 && Math.abs(velocity) < 5) {
          el.scrollLeft = target;
          setSettling(false);
          return;
        }
        momentumFrameRef.current = requestAnimationFrame(settle);
      };

      momentumFrameRef.current = requestAnimationFrame(settle);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [dragging, reduceMotion]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    cancelAnimationFrame(momentumFrameRef.current);
    setSettling(false);
    suppressClickRef.current = false;
    draggingRef.current = true;
    const now = performance.now();
    dragState.current = {
      startX: event.clientX,
      startScroll: el.scrollLeft,
      lastX: event.clientX,
      lastAt: now,
      velocity: 0,
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

  useEffect(() => () => cancelAnimationFrame(momentumFrameRef.current), []);

  return {
    trackRef,
    handlePointerDown,
    handleClickCapture,
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => setHovering(false),
  };
}

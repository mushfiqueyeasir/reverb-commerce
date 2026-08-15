"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const AUTO_SCROLL_SPEED = 40;
const DRAG_THRESHOLD = 5;

function normalizePosition(position: number, stepWidth: number) {
  if (stepWidth <= 0) return position;
  return ((position % stepWidth) + stepWidth) % stepWidth;
}

function resolvePosition(
  el: HTMLDivElement,
  position: number,
  copies: number,
) {
  const stepWidth = el.scrollWidth / copies;
  if (stepWidth > el.clientWidth) {
    return normalizePosition(position, stepWidth);
  }
  return Math.min(
    Math.max(0, el.scrollWidth - el.clientWidth),
    Math.max(0, position),
  );
}

export function useMarqueeCarousel(
  copies = 2,
  autoScrollSpeed = AUTO_SCROLL_SPEED,
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    pointerId: number;
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
  const [focusWithin, setFocusWithin] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());
  const autoScroll = !hovering && !focusWithin && !dragging && !settling;

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !autoScroll) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const stepWidth = el.scrollWidth / copies;
      if (stepWidth > el.clientWidth) {
        const elapsed = Math.min(0.05, (now - last) / 1000);
        el.scrollLeft = normalizePosition(
          el.scrollLeft + autoScrollSpeed * elapsed,
          stepWidth,
        );
      }
      last = now;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [autoScroll, autoScrollSpeed, copies]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    cancelAnimationFrame(momentumFrameRef.current);
    setSettling(false);
    suppressClickRef.current = false;
    const now = performance.now();
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: el.scrollLeft,
      lastX: event.clientX,
      lastAt: now,
      velocity: 0,
      moved: false,
    };
    setDragging(true);
    el.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    const el = trackRef.current;
    if (!drag || !el || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      drag.moved = true;
      suppressClickRef.current = true;
    }
    if (!drag.moved) return;
    event.preventDefault();
    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastAt);
    drag.velocity = -(event.clientX - drag.lastX) / elapsed;
    drag.lastX = event.clientX;
    drag.lastAt = now;
    el.scrollLeft = resolvePosition(el, drag.startScroll - dx, copies);
  };

  const finishDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    withMomentum: boolean,
  ) => {
    const drag = dragState.current;
    const el = trackRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragState.current = null;
    setDragging(false);
    if (el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    if (!withMomentum || !drag.moved || !el || reduceMotion) return;

    let position = el.scrollLeft;
    let velocity = drag.velocity * 1000;
    let previous = performance.now();
    setSettling(true);

    const settle = (now: number) => {
      const elapsed = Math.min(0.032, (now - previous) / 1000);
      previous = now;
      position += velocity * elapsed;
      velocity *= Math.pow(0.92, elapsed * 60);
      el.scrollLeft = resolvePosition(el, position, copies);
      if (Math.abs(velocity) < 5) {
        setSettling(false);
        return;
      }
      momentumFrameRef.current = requestAnimationFrame(settle);
    };

    momentumFrameRef.current = requestAnimationFrame(settle);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) =>
    finishDrag(event, true);
  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) =>
    finishDrag(event, false);

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
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleClickCapture,
    onPointerEnter: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") setHovering(true);
    },
    onPointerLeave: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") setHovering(false);
    },
    onFocusCapture: (event: React.FocusEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).matches(":focus-visible")) {
        setFocusWithin(true);
      }
    },
    onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setFocusWithin(false);
      }
    },
  };
}

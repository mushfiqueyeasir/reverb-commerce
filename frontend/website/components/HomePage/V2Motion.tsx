"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const particles = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 97}%`,
  top: `${(index * 53) % 91}%`,
  size: 1 + (index % 3),
  duration: 7 + (index % 6) * 1.4,
  delay: -(index % 9) * 0.8,
}));

export function V2Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  initiallyVisible = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  initiallyVisible?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion || initiallyVisible
          ? false
          : { opacity: 0, y, filter: "blur(8px)" }
      }
      whileInView={
        reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, amount: 0.18 }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 24,
        mass: 1,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function V2Aurora({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "200px 0px" });

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -left-[15%] -top-[35%] size-[70vw] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--v2-primary-rgb) / 0.5) 0%, rgb(var(--v2-primary-rgb) / 0.16) 32%, transparent 68%)",
        }}
        animate={
          reduceMotion || !inView
            ? undefined
            : {
                x: ["-5%", "12%", "-5%"],
                y: ["0%", "14%", "0%"],
                scale: [0.92, 1.08, 0.92],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-[45%] right-[-18%] size-[65vw] rounded-full opacity-35 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--v2-primary-rgb) / 0.42) 0%, rgb(var(--v2-foreground-rgb, 245 243 239) / 0.08) 34%, transparent 70%)",
        }}
        animate={
          reduceMotion || !inView
            ? undefined
            : {
                x: ["8%", "-10%", "8%"],
                y: ["4%", "-12%", "4%"],
                scale: [1.05, 0.9, 1.05],
              }
        }
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function V2Particles({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "200px 0px" });

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-primary shadow-[0_0_12px_rgb(var(--v2-primary-rgb)/0.9)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={
            reduceMotion
              ? { opacity: 0.28 }
              : !inView
                ? { opacity: 0.08 }
                : {
                    y: [0, -38, 0],
                    x: [0, particle.id % 2 === 0 ? 12 : -12, 0],
                    opacity: [0.08, 0.75, 0.08],
                    scale: [0.8, 1.45, 0.8],
                  }
          }
          transition={
            reduceMotion || !inView
              ? undefined
              : {
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}

export function V2Grid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgb(var(--v2-primary-rgb)/0.35)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--v2-primary-rgb)/0.35)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]",
        className,
      )}
      aria-hidden="true"
    />
  );
}

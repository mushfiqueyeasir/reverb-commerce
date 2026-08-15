"use client";

import { useEffect, useState } from "react";
import { Toaster, type ToasterProps } from "sonner";

/** Phone: top-right (above bottom nav). Desktop: bottom-right. */
export default function AppToaster({
  theme,
}: {
  theme: ToasterProps["theme"];
}) {
  const [position, setPosition] =
    useState<ToasterProps["position"]>("bottom-right");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setPosition(mq.matches ? "top-right" : "bottom-right");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Toaster
      position={position}
      theme={theme}
      toastOptions={{ style: { borderRadius: "var(--theme-radius-lg)" } }}
    />
  );
}

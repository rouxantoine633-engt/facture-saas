"use client";

import { MotionConfig } from "framer-motion";

/** Respecte la préférence « réduire les animations » du système pour toutes les animations framer-motion (RGAA 13.8 / WCAG 2.3.3). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

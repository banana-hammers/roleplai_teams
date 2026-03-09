"use client";

import { useEffect, useState } from "react";

export type Phase = "define" | "build" | "scale";

export function useActivePhase() {
  const [activePhase, setActivePhase] = useState<Phase>("define");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            const phase = entry.target.id.replace("phase-", "") as Phase;
            setActivePhase(phase);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-10% 0px -10% 0px"
      }
    );

    // Observe each phase section
    const sections = document.querySelectorAll("[id^='phase-']");
    sections.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return activePhase;
}

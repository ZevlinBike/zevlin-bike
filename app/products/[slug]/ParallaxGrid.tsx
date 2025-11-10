"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function ParallaxGrid({
  gridSize = 56,
  intensity = 0.04,
}: {
  gridSize?: number;
  intensity?: number;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 60, damping: 20 });
  const y = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth - 0.5) * 2; // -1..1
      const ny = (e.clientY / innerHeight - 0.5) * 2;
      mx.set(nx * 30 * intensity);
      my.set(ny * 20 * intensity);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [intensity, mx, my]);

  const lineLight = "rgba(0,0,0,0.06)";
  const lineDark = "rgba(255,255,255,0.06)";

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
      <div className="absolute inset-0" style={{ perspective: 1200 }}>
        <motion.div
          style={{ x, y, rotateX: 58, rotateZ: 0 }}
          className="absolute left-1/2 top-[-10%] h-[140vh] w-[160vw] -translate-x-1/2"
        >
          <div
            className="h-full w-full blur-[1px] opacity-70 dark:opacity-60"
            style={{
              backgroundImage: `
                linear-gradient(to right, ${lineLight} 1px, transparent 1px),
                linear-gradient(to bottom, ${lineLight} 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
              maskImage: "radial-gradient(closest-side, rgba(0,0,0,0.65), transparent 85%)",
              WebkitMaskImage: "radial-gradient(closest-side, rgba(0,0,0,0.65), transparent 85%)",
            }}
          />
          <div
            className="h-full w-full blur-[1px] opacity-0 dark:opacity-70 mix-blend-screen absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, ${lineDark} 1px, transparent 1px),
                linear-gradient(to bottom, ${lineDark} 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
              maskImage: "radial-gradient(closest-side, rgba(0,0,0,0.7), transparent 85%)",
              WebkitMaskImage: "radial-gradient(closest-side, rgba(0,0,0,0.7), transparent 85%)",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type TrailNote = {
  id: number;
  x: number;
  y: number;
  symbol: string;
  rotation: number;
};

const symbols = ["\u266A", "\u266B", "\u266C", "\u2669", "\u266F"];

export const MusicCursorTrail = () => {
  const [notes, setNotes] = useState<TrailNote[]>([]);
  const lastPoint = useRef({ x: 0, y: 0, time: 0 });
  const idRef = useRef(0);

  useEffect(() => {
    const canAnimate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!canAnimate || !canHover) return;

    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now();
      const dx = event.clientX - lastPoint.current.x;
      const dy = event.clientY - lastPoint.current.y;
      const distance = Math.hypot(dx, dy);

      if (now - lastPoint.current.time < 38 || distance < 14) return;

      lastPoint.current = { x: event.clientX, y: event.clientY, time: now };

      const id = idRef.current++;
      const symbol = symbols[id % symbols.length];
      const rotation = -22 + Math.random() * 44;

      setNotes((current) => [
        ...current.slice(-15),
        { id, x: event.clientX, y: event.clientY, symbol, rotation },
      ]);

      window.setTimeout(() => {
        setNotes((current) => current.filter((note) => note.id !== id));
      }, 950);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {notes.map((note) => (
          <motion.span
            key={note.id}
            className="absolute select-none text-2xl font-black text-neutral-950 drop-shadow-[0_2px_8px_rgba(255,255,255,0.75)] dark:text-emerald-200 dark:drop-shadow-[0_0_14px_rgba(110,231,183,0.75)]"
            style={{ left: note.x, top: note.y }}
            initial={{ opacity: 0, scale: 0.55, x: -5, y: -5, rotate: note.rotation }}
            animate={{ opacity: [0, 1, 0], scale: [0.55, 1.12, 0.82], x: 20, y: -40, rotate: note.rotation + 22 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.95, ease: "easeOut" }}
          >
            {note.symbol}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

import { motion } from 'motion/react';

// 7 petals, each with unique path, size, start position, and timing
const PETALS = [
  { id: 1, startX: '12vw',  startY: '-5vh',  size: 22, dur: 16, delay: 0,   rotate: 35  },
  { id: 2, startX: '28vw',  startY: '-8vh',  size: 17, dur: 21, delay: 2.5, rotate: -20 },
  { id: 3, startX: '55vw',  startY: '-3vh',  size: 25, dur: 18, delay: 1.2, rotate: 60  },
  { id: 4, startX: '72vw',  startY: '-6vh',  size: 14, dur: 22, delay: 4,   rotate: -45 },
  { id: 5, startX: '88vw',  startY: '-4vh',  size: 20, dur: 14, delay: 0.8, rotate: 15  },
  { id: 6, startX: '42vw',  startY: '-7vh',  size: 18, dur: 19, delay: 3.1, rotate: -30 },
  { id: 7, startX: '65vw',  startY: '-2vh',  size: 16, dur: 17, delay: 5.5, rotate: 50  },
] as const;

// Simple botanical petal SVG path
function PetalSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 24 38"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 37C12 37 2 24 2 13C2 6.9 6.5 2 12 2C17.5 2 22 6.9 22 13C22 24 12 37 12 37Z"
        fill="rgba(139, 163, 150, 0.5)"
        stroke="rgba(139, 163, 150, 0.3)"
        strokeWidth="0.5"
      />
      <path
        d="M12 5 Q14 13 12 35"
        stroke="rgba(139, 163, 150, 0.4)"
        strokeWidth="0.5"
        fill="none"
      />
    </svg>
  );
}

/**
 * 7 ambient SVG petals drifting across the Splash section.
 * Only rendered when prefers-reduced-motion is unset.
 * Each petal loops independently on a 14–22s cycle.
 */
export function Petals() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 2,
      }}
    >
      {PETALS.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.startX,
            top: p.startY,
            opacity: 0.35,
          }}
          animate={{
            y: ['0vh', '115vh'],
            rotate: [p.rotate, p.rotate + 180, p.rotate + 360],
            x: [0, p.id % 2 === 0 ? 30 : -30, 0],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <PetalSvg size={p.size} />
        </motion.div>
      ))}
    </div>
  );
}

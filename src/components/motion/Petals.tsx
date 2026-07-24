import { useEffect, useRef } from 'react';

// ─── Config ───────────────────────────────────────────────────────────────────

const COUNT          = 28;
const REPEL_RADIUS   = 180;  // px — interaction field radius
const REPEL_STRENGTH = 1.8;  // push force magnitude
const MAX_VX         = 3;    // horizontal velocity cap
const MAX_VY_UP      = 2.5;  // max upward speed (negative vy)
const MAX_VY_DOWN    = 4;    // max downward speed

// Color palette: white → cream → blush → soft rose
const COLORS: [number, number, number][] = [
  [255, 255, 255],  // white
  [255, 248, 242],  // warm cream
  [255, 232, 232],  // blush
  [255, 215, 215],  // light rose
  [250, 220, 225],  // petal pink
];

// ─── Petal type ───────────────────────────────────────────────────────────────

interface Petal {
  x: number;
  y: number;
  size: number;
  rotation: number;    // radians
  rotSpeed: number;    // radians / frame
  vy: number;          // vertical speed
  vx: number;          // current horizontal velocity
  baseVx: number;      // original drift to return to
  sway: number;        // current phase
  swaySpeed: number;   // radians / frame
  swayAmp: number;     // px peak sway
  opacity: number;
  color: [number, number, number];
}

function makePetal(vw: number, vh: number, scattered: boolean): Petal {
  const vx = (Math.random() - 0.5) * 0.3;
  const vy = 0.35 + Math.random() * 0.7;
  return {
    x:         Math.random() * vw,
    y:         scattered ? Math.random() * vh : -(8 + Math.random() * 20),
    size:      7 + Math.random() * 11,           // 7 – 18 px
    rotation:  Math.random() * Math.PI * 2,
    rotSpeed:  (Math.random() - 0.5) * 0.045,
    vy,
    vx,
    baseVx:    vx,
    sway:      Math.random() * Math.PI * 2,
    swaySpeed: 0.007 + Math.random() * 0.013,
    swayAmp:   0.6 + Math.random() * 1.8,
    opacity:   0.22 + Math.random() * 0.32,       // 22 – 54 % — subtle but visible
    color:     COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

// ─── Draw a single teardrop petal with gradient + center vein ─────────────────

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal) {
  const { x, y, size, rotation, opacity, color: [r, g, b] } = p;
  const w = size * 0.55;
  const h = size;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Petal outline (teardrop bezier)
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.bezierCurveTo( w, -h * 0.45,  w,  h * 0.35, 0,  h);
  ctx.bezierCurveTo(-w,  h * 0.35, -w, -h * 0.45, 0, -h);
  ctx.closePath();

  // Radial gradient for soft light-catching effect
  const grad = ctx.createRadialGradient(-w * 0.3, -h * 0.4, 0, 0, 0, h * 1.1);
  grad.addColorStop(0,   `rgba(${r},${g},${b},${opacity})`);
  grad.addColorStop(0.5, `rgba(${r - 10},${g - 8},${b - 5},${opacity * 0.88})`);
  grad.addColorStop(1,   `rgba(${r - 20},${g - 15},${b - 10},${opacity * 0.55})`);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle center vein
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.75);
  ctx.quadraticCurveTo(w * 0.15, 0, 0, h * 0.8);
  ctx.strokeStyle = `rgba(${r - 35},${g - 30},${b - 25},${opacity * 0.28})`;
  ctx.lineWidth   = 0.6;
  ctx.stroke();

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Petals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let vw = canvas.offsetWidth;
    let vh = canvas.offsetHeight;
    canvas.width  = vw;
    canvas.height = vh;

    // Half scattered across screen on load, half queued above top
    const petals: Petal[] = Array.from({ length: COUNT }, (_, i) =>
      makePetal(vw, vh, i >= COUNT / 2)
    );

    let rafId: number;

    function tick() {
      ctx!.clearRect(0, 0, vw, vh);

      for (const p of petals) {
        // Return horizontal drift to original — gravity handles vertical naturally
        p.vx += (p.baseVx - p.vx) * 0.30;

        // Wind sway
        p.sway += p.swaySpeed;
        p.x    += p.vx + Math.sin(p.sway) * p.swayAmp;

        // Gravity — accelerates gently, caps so it never feels mechanical
        p.vy = Math.min(p.vy + 0.006, 1.8);
        p.y += p.vy;

        // Tumble
        p.rotation += p.rotSpeed;

        // Wrap horizontally so petals re-enter from the other side
        if (p.x < -p.size * 2)    p.x = vw + p.size;
        if (p.x > vw + p.size * 2) p.x = -p.size;

        // Recycle petal when it exits the bottom
        if (p.y > vh + p.size * 2) {
          Object.assign(p, makePetal(vw, vh, false));
        }

        drawPetal(ctx!, p);
      }

      rafId = requestAnimationFrame(tick);
    }

    tick();

    // ── Repulsion interaction ──────────────────────────────────────────────────

    function applyRepulsion(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;

      for (const p of petals) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0 || dist > REPEL_RADIUS) continue;

        // Force falls off with distance (stronger when closer)
        const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
        const nx = dx / dist;  // unit vector away from cursor
        const ny = dy / dist;

        p.vx = Math.max(-MAX_VX, Math.min(MAX_VX, p.vx + nx * force));
        p.vy = Math.max(-MAX_VY_UP, Math.min(MAX_VY_DOWN, p.vy + ny * force));
      }
    }

    let pressing = false;

    function onMouseDown(e: MouseEvent) { pressing = true; applyRepulsion(e.clientX, e.clientY); }
    function onMouseMove(e: MouseEvent) { if (pressing) applyRepulsion(e.clientX, e.clientY); }
    function onMouseUp()                { pressing = false; }

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      if (t) applyRepulsion(t.clientX, t.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t) applyRepulsion(t.clientX, t.clientY);
    }

    window.addEventListener('mousedown',  onMouseDown,  { passive: true });
    window.addEventListener('mousemove',  onMouseMove,  { passive: true });
    window.addEventListener('mouseup',    onMouseUp,    { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove',  onTouchMove,  { passive: true });

    function onResize() {
      if (!canvas) return;
      vw = canvas.offsetWidth;
      vh = canvas.offsetHeight;
      canvas.width  = vw;
      canvas.height = vh;
    }

    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseup',    onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('resize',     onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,          // above photo overlays, below text (z-index: 3)
      }}
    />
  );
}

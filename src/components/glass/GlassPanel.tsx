import { useEffect, useRef, useState } from 'react';

export type GlassVariant = 'light' | 'dark' | 'gold';
type GlassRadius  = 'panel' | 'pill';

export interface GlassPanelProps {
  variant?: GlassVariant;
  radius?: GlassRadius;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  as?: React.ElementType;
}

/**
 * The one glass primitive. Three variants (light · dark · gold), four layers:
 * base tint · backdrop blur · rim light · ambient shadow.
 * Plays a specular sweep once when it first enters the viewport.
 */
export function GlassPanel({
  variant = 'light',
  radius = 'panel',
  className = '',
  style,
  children,
  as: Tag = 'div',
}: GlassPanelProps) {
  const ref    = useRef<HTMLDivElement>(null);
  const [swept, setSwept] = useState(false);

  // Trigger the specular sweep once when the panel enters the viewport
  useEffect(() => {
    if (swept) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSwept(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [swept]);

  return (
    <Tag
      ref={ref}
      className={[
        'glass',
        `glass--${variant}`,
        `glass--${radius}`,
        className,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {/* Specular sweep layer */}
      <span
        aria-hidden="true"
        className={['glass-sweep', swept ? 'glass-sweep--playing' : ''].join(' ')}
      />

      {/* Content sits above the sweep */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </Tag>
  );
}

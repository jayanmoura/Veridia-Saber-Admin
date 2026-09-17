import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { twMerge } from 'tailwind-merge';

interface FloatingLeavesProps {
  className?: string;
  count?: number;
}

interface LeafData {
  x: number;
  y: number;
  vx: number;
  phase: number;
  waveAmp: number;
  rotation: number;
  spin: number;
  size: number;
  opacity: number;
  repelVx: number;
  repelVy: number;
}

interface WindStreakData {
  x: number;
  y: number;
  vx: number;
  width: number;
  opacity: number;
  colorClass: string;
}

const STREAK_CONFIGS = [
  { colorClass: 'text-forest-400', width: 90, opacity: 0.12, vx: 2.8 },
  { colorClass: 'text-forest-200', width: 130, opacity: 0.10, vx: 3.2 },
  { colorClass: 'text-forest-400', width: 80, opacity: 0.08, vx: 2.4 },
  { colorClass: 'text-forest-200', width: 110, opacity: 0.11, vx: 3.0 },
];

const PRESET_LEAVES = [
  { size: 18, opacity: 0.22, vx: 0.85, waveAmp: 0.45, spin: 0.25 },
  { size: 28, opacity: 0.26, vx: 1.15, waveAmp: 0.65, spin: -0.35 },
  { size: 15, opacity: 0.19, vx: 0.75, waveAmp: 0.35, spin: 0.18 },
  { size: 32, opacity: 0.24, vx: 1.25, waveAmp: 0.70, spin: -0.28 },
  { size: 22, opacity: 0.25, vx: 0.95, waveAmp: 0.50, spin: 0.32 },
  { size: 16, opacity: 0.20, vx: 0.80, waveAmp: 0.40, spin: -0.22 },
  { size: 30, opacity: 0.23, vx: 1.10, waveAmp: 0.60, spin: 0.28 },
  { size: 20, opacity: 0.21, vx: 0.90, waveAmp: 0.48, spin: -0.30 },
  { size: 26, opacity: 0.27, vx: 1.05, waveAmp: 0.55, spin: 0.34 },
  { size: 14, opacity: 0.18, vx: 0.70, waveAmp: 0.38, spin: -0.15 },
  { size: 34, opacity: 0.22, vx: 1.20, waveAmp: 0.75, spin: 0.22 },
  { size: 24, opacity: 0.25, vx: 1.00, waveAmp: 0.52, spin: -0.26 },
  { size: 17, opacity: 0.20, vx: 0.82, waveAmp: 0.42, spin: 0.19 },
  { size: 29, opacity: 0.24, vx: 1.12, waveAmp: 0.62, spin: -0.31 },
];

export function FloatingLeaves({ className = '', count = 12 }: FloatingLeavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
  const streakRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const leafCount = Math.min(Math.max(count, 10), 14);

  // Inicializa dados das folhas com ampla variação de presets de escala (14px a 34px), velocidade e opacidade
  const [initialLeaves] = useState<LeafData[]>(() => {
    return Array.from({ length: leafCount }, (_, i) => {
      const preset = PRESET_LEAVES[i % PRESET_LEAVES.length];
      return {
        x: (i / leafCount) * 800 + (Math.random() - 0.5) * 60,
        y: Math.random() * 160 + 20,
        vx: preset.vx,
        phase: Math.random() * Math.PI * 2,
        waveAmp: preset.waveAmp,
        rotation: Math.random() * 360,
        spin: preset.spin,
        size: preset.size,
        opacity: preset.opacity,
        repelVx: 0,
        repelVy: 0,
      };
    });
  });

  const leavesRef = useRef<LeafData[]>(initialLeaves);
  const streaksRef = useRef<WindStreakData[]>([]);

  const [prefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Ajusta dimensões iniciais conforme o tamanho real do container montado
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 200;

    leavesRef.current.forEach((leaf, i) => {
      leaf.x = (i / leafCount) * width + (Math.random() - 0.5) * 50;
      leaf.y = Math.random() * (height - 40) + 20;
    });

    streaksRef.current = STREAK_CONFIGS.map((cfg, i) => ({
      x: (i / STREAK_CONFIGS.length) * width + Math.random() * 50,
      y: 25 + Math.random() * (height - 50),
      vx: cfg.vx,
      width: cfg.width,
      opacity: cfg.opacity,
      colorClass: cfg.colorClass,
    }));
  }, [leafCount]);

  // Loop de animação contínuo via requestAnimationFrame
  useEffect(() => {
    if (prefersReducedMotion) return;

    let animId: number;
    let time = 0;

    const animate = () => {
      const container = containerRef.current;
      if (!container) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const leaves = leavesRef.current;
      const streaks = streaksRef.current;
      const mouse = mouseRef.current;
      time += 0.025;

      // 1. Atualizar folhas flutuantes (emoji 🍁)
      leaves.forEach((leaf, idx) => {
        // Repulsão suave do mouse: força moderada e retorno suave
        if (mouse.active) {
          const dx = leaf.x - mouse.x;
          const dy = leaf.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influenceRadius = 70;

          if (dist < influenceRadius && dist > 0.01) {
            const force = (1 - dist / influenceRadius) * 0.75;
            const angle = Math.atan2(dy, dx);
            leaf.repelVx += Math.cos(angle) * force;
            leaf.repelVy += Math.sin(angle) * force;
            leaf.rotation += (dx > 0 ? 1 : -1) * force * 1.5;
          }
        }

        // Fricção para retornar suavemente ao curso normal do vento
        leaf.repelVx *= 0.86;
        leaf.repelVy *= 0.86;

        // Limites verticais suaves
        if (leaf.y < 15) leaf.repelVy += 0.15;
        if (leaf.y > height - 15) leaf.repelVy -= 0.15;

        // Posição e rotação contínua
        leaf.x += leaf.vx + leaf.repelVx;
        leaf.y += Math.sin(time + leaf.phase) * leaf.waveAmp + leaf.repelVy;
        leaf.rotation += leaf.spin + leaf.repelVx * 1.2;

        // Loop contínuo atravessando todo o card
        if (leaf.x > width + 35) {
          leaf.x = -35;
          leaf.y = Math.random() * (height - 40) + 20;
          leaf.repelVx = 0;
          leaf.repelVy = 0;
        }

        const elem = leafRefs.current[idx];
        if (elem) {
          elem.style.transform = `translate3d(${leaf.x}px, ${leaf.y}px, 0) rotate(${leaf.rotation}deg)`;
        }
      });

      // 2. Atualizar rajadas de vento dinâmicas (streaks)
      streaks.forEach((streak, idx) => {
        streak.x += streak.vx;
        if (streak.x > width + streak.width) {
          streak.x = -streak.width;
          streak.y = 20 + Math.random() * (height - 40);
        }

        const elem = streakRefs.current[idx];
        if (elem) {
          elem.style.transform = `translate3d(${streak.x}px, ${streak.y}px, 0)`;
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [prefersReducedMotion]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={twMerge('overflow-hidden cursor-grab active:cursor-grabbing select-none', className || 'relative w-full h-full')}
      style={{
        // Máscara horizontal: quase imperceptível sobre o texto à esquerda, nítida à direita
        maskImage: 'linear-gradient(to right, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,1) 100%)',
        WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,1) 100%)',
      }}
      title="Brisa botânica — passe o cursor para interagir"
      aria-hidden="true"
    >
      {/* Rajadas de vento animadas (streaks) */}
      {STREAK_CONFIGS.map((streak, idx) => (
        <div
          key={`streak-${idx}`}
          ref={(el) => {
            streakRefs.current[idx] = el;
          }}
          className={`absolute top-0 left-0 pointer-events-none rounded-full will-change-transform ${streak.colorClass}`}
          style={{
            width: `${streak.width}px`,
            height: '1.5px',
            opacity: streak.opacity,
            background: 'linear-gradient(to right, transparent 0%, currentColor 50%, transparent 100%)',
            transform: prefersReducedMotion ? 'none' : 'translate3d(-150px, 0, 0)',
          }}
        />
      ))}

      {/* Folhas de bordo flutuantes com emoji 🍁 */}
      {initialLeaves.map((leaf, idx) => (
        <div
          key={`leaf-${idx}`}
          ref={(el) => {
            leafRefs.current[idx] = el;
          }}
          className="absolute top-0 left-0 will-change-transform pointer-events-none select-none flex items-center justify-center leading-none"
          style={{
            fontSize: `${leaf.size}px`,
            opacity: leaf.opacity,
            transform: prefersReducedMotion
              ? `translate3d(${60 + idx * 110}px, ${30 + (idx % 3) * 45}px, 0) rotate(${idx * 45}deg)`
              : 'translate3d(-60px, -60px, 0)',
          }}
          aria-hidden="true"
        >
          <span aria-hidden="true" className="inline-block">🍁</span>
        </div>
      ))}
    </div>
  );
}

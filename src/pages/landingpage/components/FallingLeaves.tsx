import { useEffect, useRef } from 'react';

const MAX_LEAVES = 18;
const BASE_SIZE = 18;
const WIND = 0.3;
const SPAWN_INTERVAL_MS = 800;

const LEAF_COLORS = [
  'rgba(180, 220, 160, 0.35)',
  'rgba(160, 200, 130, 0.30)',
  'rgba(200, 230, 180, 0.28)',
  'rgba(140, 190, 110, 0.32)',
  'rgba(220, 240, 200, 0.25)'
];

interface Leaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  color: string;
  alpha: number;
}

export function FallingLeaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let leaves: Leaf[] = [];
    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const spawnLeaf = () => {
      if (leaves.length < MAX_LEAVES) {
        leaves.push({
          x: Math.random() * canvas.width,
          y: -20,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0.6 + Math.random() * 0.8,
          size: BASE_SIZE * (0.7 + Math.random() * 0.6),
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.016,
          color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
          alpha: 0.25 + Math.random() * 0.15
        });
      }
    };

    spawnLeaf();
    const spawnInterval = setInterval(spawnLeaf, SPAWN_INTERVAL_MS);

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      leaves = leaves.filter((leaf) => {
        leaf.x += leaf.vx + WIND;
        leaf.y += leaf.vy;
        leaf.angle += leaf.spin;

        if (leaf.y > canvas.height + 30) {
          return false;
        }

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle);
        ctx.globalAlpha = leaf.alpha;

        ctx.beginPath();
        ctx.moveTo(0, -leaf.size * 0.5);
        ctx.bezierCurveTo(leaf.size * 0.45, -leaf.size * 0.25, leaf.size * 0.45, leaf.size * 0.25, 0, leaf.size * 0.5);
        ctx.bezierCurveTo(-leaf.size * 0.45, leaf.size * 0.25, -leaf.size * 0.45, -leaf.size * 0.25, 0, -leaf.size * 0.5);
        ctx.closePath();

        ctx.fillStyle = leaf.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -leaf.size * 0.45);
        ctx.lineTo(0, leaf.size * 0.45);
        ctx.strokeStyle = 'rgba(100, 140, 80, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();

        return true;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(spawnInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none z-[9999]"
    />
  );
}

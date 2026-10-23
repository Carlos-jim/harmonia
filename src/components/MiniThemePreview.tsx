import React, { useEffect, useRef } from 'react';
import { ThemePreset } from '../types/theme';

interface MiniThemePreviewProps {
  preset: ThemePreset;
  isSelected: boolean;
}

/**
 * MiniThemePreview:
 * Renderiza una vista previa animada en tiempo real de cada plantilla temática estilo Spicetify.
 * Cada tarjeta cobra vida con Canvas 2D interactivo, bucles de video o auras fluidas.
 */
export const MiniThemePreview: React.FC<MiniThemePreviewProps> = ({ preset, isSelected }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (preset.type !== 'animated-canvas' || !preset.canvasEffect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const w = (canvas.width = 240);
    const h = (canvas.height = 120);
    const effect = preset.canvasEffect;

    // Elementos de animación para cada efecto mini
    let tick = 0;

    // Cyberpunk Rain
    const rain = Array.from({ length: 25 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: 8 + Math.random() * 14,
      spd: 3 + Math.random() * 5,
      col: Math.random() > 0.4 ? '#00f0ff' : '#ff007f'
    }));

    // Starfield
    const stars = Array.from({ length: 50 }).map(() => ({
      x: (Math.random() - 0.5) * w,
      y: (Math.random() - 0.5) * h,
      z: Math.random() * w
    }));

    // Snow
    const snow = Array.from({ length: 28 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 1.8,
      spd: 0.5 + Math.random() * 1.2
    }));

    // Lo-Fi
    const orbs = Array.from({ length: 12 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 3 + Math.random() * 6,
      vy: -0.4 - Math.random() * 0.4
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      tick += 1;

      if (effect === 'cyberpunk-rain') {
        ctx.fillStyle = '#06020c';
        ctx.fillRect(0, 0, w, h);
        rain.forEach((r) => {
          ctx.beginPath();
          ctx.strokeStyle = r.col;
          ctx.lineWidth = 1.2;
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x, r.y + r.len);
          ctx.stroke();
          r.y += r.spd;
          if (r.y > h) {
            r.y = -r.len;
            r.x = Math.random() * w;
          }
        });
      } else if (effect === 'starfield') {
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        stars.forEach((s) => {
          s.z -= 1.8;
          if (s.z <= 0) {
            s.z = w;
            s.x = (Math.random() - 0.5) * w;
            s.y = (Math.random() - 0.5) * h;
          }
          const k = 100 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;
          if (px >= 0 && px <= w && py >= 0 && py <= h) {
            ctx.fillStyle = 'rgba(199, 210, 254, 0.85)';
            ctx.fillRect(px, py, 1.6, 1.6);
          }
        });
      } else if (effect === 'aurora-waves') {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, w, h);
        const waves = [
          { col: 'rgba(6, 182, 212, 0.4)', freq: 0.02, spd: 0.04, y: 55 },
          { col: 'rgba(147, 51, 234, 0.45)', freq: 0.015, spd: 0.03, y: 75 }
        ];
        waves.forEach((wv) => {
          ctx.beginPath();
          ctx.fillStyle = wv.col;
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) {
            const y = wv.y + Math.sin(x * wv.freq + tick * wv.spd) * 16;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
        });
      } else if (effect === 'retro-synthwave') {
        ctx.fillStyle = '#0a0014';
        ctx.fillRect(0, 0, w, h);
        const hy = h * 0.55;
        const cx = w / 2;

        // Mini Sol
        const sunR = 24;
        const sunGrad = ctx.createLinearGradient(cx, hy - sunR, cx, hy + sunR);
        sunGrad.addColorStop(0, '#fde047');
        sunGrad.addColorStop(1, '#ec4899');
        ctx.beginPath();
        ctx.arc(cx, hy - 4, sunR, 0, Math.PI * 2);
        ctx.fillStyle = sunGrad;
        ctx.fill();

        // Franjas de corte
        ctx.fillStyle = '#0a0014';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(cx - sunR, hy - 2 + i * 5, sunR * 2, 2);
        }

        // Suelo cuadrícula
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
        ctx.lineWidth = 1;
        for (let i = -8; i <= 8; i++) {
          ctx.beginPath();
          ctx.moveTo(cx, hy);
          ctx.lineTo(cx + i * 20, h);
          ctx.stroke();
        }
        const offset = (tick * 0.8) % 15;
        for (let y = 0; y < 5; y++) {
          const py = hy + Math.pow(y / 5, 2) * (h - hy) + offset * (y / 5);
          if (py >= hy && py <= h) {
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
            ctx.stroke();
          }
        }
      } else if (effect === 'bloom-mesh') {
        ctx.fillStyle = '#090514';
        ctx.fillRect(0, 0, w, h);
        const bTick = tick * 0.02;
        const colors = ['rgba(168, 85, 247, 0.5)', 'rgba(236, 72, 153, 0.4)', 'rgba(6, 182, 212, 0.4)'];
        colors.forEach((col, idx) => {
          const bx = w * 0.5 + Math.cos(bTick + idx * 2) * 45;
          const by = h * 0.5 + Math.sin(bTick * 0.8 + idx * 2) * 25;
          const g = ctx.createRadialGradient(bx, by, 0, bx, by, 50);
          g.addColorStop(0, col);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(bx, by, 50, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (effect === 'nordic-snow') {
        ctx.fillStyle = '#080d16';
        ctx.fillRect(0, 0, w, h);
        snow.forEach((s) => {
          s.y += s.spd;
          if (s.y > h) s.y = -2;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
          ctx.fill();
        });
      } else if (effect === 'lofi-particles') {
        ctx.fillStyle = '#0d0802';
        ctx.fillRect(0, 0, w, h);
        orbs.forEach((o) => {
          o.y += o.vy;
          if (o.y < -o.r) o.y = h + o.r;
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.fill();
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [preset.type, preset.canvasEffect]);

  // 1. MODO VIDEO LOOP
  if (preset.type === 'video-loop' && preset.backgroundUrl) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${isSelected ? 'ring-1 ring-emerald-500/50' : ''}`}>
        <video
          src={preset.backgroundUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
    );
  }

  // 2. MODO CANVAS ANIMADO PROCEDURAL
  if (preset.type === 'animated-canvas') {
    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ width: '100%', height: '100%' }}
      />
    );
  }

  // 3. MODO REACTIVO / DRIBBLISH VINILO
  if (preset.type === 'dynamic-album') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-900 to-black flex items-center justify-center">
        {/* Aura brillante */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 to-teal-400/20 animate-pulse" />
        
        {/* Disco de vinilo giratorio en miniatura */}
        <div
          className="w-16 h-16 rounded-full bg-[#111] border border-white/20 shadow-xl flex items-center justify-center animate-spin"
          style={{ animationDuration: '10s' }}
        >
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-emerald-500 shadow-md flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. MODO OLED BLACK
  if (preset.type === 'oled-black') {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-1.5 border border-white/5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#1db954] shadow-[0_0_8px_#1db954]" />
        <span className="text-[10px] font-mono tracking-widest text-[#727272] uppercase font-bold">
          0.00 NIT OLED
        </span>
      </div>
    );
  }

  // 5. DEFAULT / CUSTOM
  return (
    <div className={`w-full h-full bg-gradient-to-br ${preset.previewGradient} flex items-center justify-center`}>
      <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
        Wallpaper
      </span>
    </div>
  );
};

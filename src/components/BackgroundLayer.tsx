import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../stores/useThemeStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { ExtractedPalette } from '../services/color/ColorExtractor';

interface BackgroundLayerProps {
  ambientPalette: ExtractedPalette | null;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ ambientPalette }) => {
  const { currentPresetId, customUrl, customType, blur, opacity, getActivePreset } = useThemeStore();
  const { currentTrack } = usePlayerStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const preset = getActivePreset();

  // Gestión de los efectos de animación procedural en Canvas (60fps, luminosos y optimizados)
  useEffect(() => {
    if (preset.type !== 'animated-canvas' || !preset.canvasEffect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const effect = preset.canvasEffect;

    // --- SETUP CYBERPUNK RAIN ---
    interface RainDrop {
      x: number;
      y: number;
      len: number;
      speed: number;
      color: string;
      width: number;
    }
    const rainColors = ['#00f0ff', '#ff007f', '#38bdf8', '#f43f5e', '#a855f7'];
    const rainDrops: RainDrop[] = Array.from({ length: 160 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 25 + Math.random() * 45,
      speed: 10 + Math.random() * 16,
      color: rainColors[Math.floor(Math.random() * rainColors.length)],
      width: 1.2 + Math.random() * 1.4
    }));

    // --- SETUP STARFIELD / WARP ---
    interface Star {
      x: number;
      y: number;
      z: number;
      pz: number;
      color: string;
    }
    const starColors = ['#a5b4fc', '#818cf8', '#38bdf8', '#c084fc', '#ffffff'];
    const stars: Star[] = Array.from({ length: 350 }).map(() => {
      const z = Math.random() * width;
      return {
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z,
        pz: z,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      };
    });

    // --- SETUP LO-FI PARTICLES ---
    interface LofiOrb {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
    }
    const lofiColors = ['#f59e0b', '#fb923c', '#ea580c', '#fbbf24', '#f97316'];
    const lofiOrbs: LofiOrb[] = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 6 + Math.random() * 18,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -0.4 - Math.random() * 0.9,
      alpha: 0.25 + Math.random() * 0.45,
      color: lofiColors[Math.floor(Math.random() * lofiColors.length)]
    }));

    // --- SETUP NORDIC SNOW ---
    interface Snowflake {
      x: number;
      y: number;
      radius: number;
      speed: number;
      drift: number;
      alpha: number;
    }
    const snowflakes: Snowflake[] = Array.from({ length: 110 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.5 + Math.random() * 3.5,
      speed: 0.8 + Math.random() * 1.6,
      drift: Math.random() * Math.PI * 2,
      alpha: 0.3 + Math.random() * 0.6
    }));

    let tick = 0;

    // Render loop a 60 FPS con alta luminosidad para refracción de vidrio
    const render = () => {
      if (document.visibilityState === 'hidden') {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      tick += 0.015;
      ctx.clearRect(0, 0, width, height);

      if (effect === 'cyberpunk-rain') {
        // 1. Fondo atmosférico de noche neón
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0c071e');
        bgGrad.addColorStop(0.5, '#160829');
        bgGrad.addColorStop(1, '#081426');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Orbes neón de luz ambiental flotante
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const orb1X = width * 0.25 + Math.cos(tick * 0.8) * 120;
        const orb1Y = height * 0.35 + Math.sin(tick * 0.6) * 90;
        const g1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, 450);
        g1.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
        g1.addColorStop(1, 'transparent');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(orb1X, orb1Y, 450, 0, Math.PI * 2);
        ctx.fill();

        const orb2X = width * 0.75 + Math.sin(tick * 0.7) * 140;
        const orb2Y = height * 0.65 + Math.cos(tick * 0.5) * 110;
        const g2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, 500);
        g2.addColorStop(0, 'rgba(255, 0, 127, 0.4)');
        g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(orb2X, orb2Y, 500, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Gotas de lluvia neón en cascada con estela brillante
        ctx.save();
        rainDrops.forEach((d) => {
          ctx.beginPath();
          ctx.strokeStyle = d.color;
          ctx.lineWidth = d.width;
          ctx.shadowColor = d.color;
          ctx.shadowBlur = 8;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x, d.y + d.len);
          ctx.stroke();

          d.y += d.speed;
          if (d.y > height) {
            d.y = -d.len;
            d.x = Math.random() * width;
          }
        });
        ctx.restore();

        // 4. Reflejo de calle neón en la parte inferior
        const streetGrad = ctx.createLinearGradient(0, height - 160, 0, height);
        streetGrad.addColorStop(0, 'transparent');
        streetGrad.addColorStop(1, 'rgba(255, 0, 127, 0.28)');
        ctx.fillStyle = streetGrad;
        ctx.fillRect(0, height - 160, width, 160);
      } else if (effect === 'bloom-mesh') {
        // Gradiente líquido orgánico estilo Apple Music / iOS Liquid Glass
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0a0518');
        bgGrad.addColorStop(1, '#050a18');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const blobs = [
          {
            x: width * 0.3 + Math.cos(tick * 1.1) * (width * 0.2),
            y: height * 0.35 + Math.sin(tick * 0.9) * (height * 0.2),
            r: Math.min(width, height) * 0.65,
            color: 'rgba(168, 85, 247, 0.75)' // Púrpura eléctrico
          },
          {
            x: width * 0.7 + Math.sin(tick * 1.0) * (width * 0.22),
            y: height * 0.4 + Math.cos(tick * 0.8) * (height * 0.18),
            r: Math.min(width, height) * 0.6,
            color: 'rgba(236, 72, 153, 0.7)' // Rosa neón
          },
          {
            x: width * 0.5 + Math.cos(tick * 0.7) * (width * 0.25),
            y: height * 0.7 + Math.sin(tick * 1.2) * (height * 0.18),
            r: Math.min(width, height) * 0.7,
            color: 'rgba(6, 182, 212, 0.7)' // Azul cian líquido
          },
          {
            x: width * 0.2 + Math.sin(tick * 0.8) * (width * 0.16),
            y: height * 0.75 + Math.cos(tick * 1.1) * (height * 0.2),
            r: Math.min(width, height) * 0.55,
            color: 'rgba(16, 185, 129, 0.65)' // Verde esmeralda
          },
          {
            x: width * 0.8 + Math.cos(tick * 1.3) * (width * 0.18),
            y: height * 0.25 + Math.sin(tick * 0.9) * (height * 0.16),
            r: Math.min(width, height) * 0.5,
            color: 'rgba(245, 158, 11, 0.6)' // Ámbar dorado
          }
        ];

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        blobs.forEach((b) => {
          const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
          g.addColorStop(0, b.color);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      } else if (effect === 'aurora-waves') {
        // Fondo marino abisal
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(1, '#071630');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 4 cintas de plasma bioluminiscente ondulante
        const waves = [
          { color: 'rgba(6, 182, 212, 0.45)', freq: 0.0025, speed: 1.1, yOffset: height * 0.35, amp: 90 },
          { color: 'rgba(59, 130, 246, 0.45)', freq: 0.002, speed: 1.4, yOffset: height * 0.45, amp: 100 },
          { color: 'rgba(147, 51, 234, 0.5)', freq: 0.0022, speed: 0.9, yOffset: height * 0.55, amp: 110 },
          { color: 'rgba(20, 184, 166, 0.4)', freq: 0.0018, speed: 1.2, yOffset: height * 0.65, amp: 85 }
        ];

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        waves.forEach((w) => {
          ctx.beginPath();
          ctx.fillStyle = w.color;
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 15) {
            const y = w.yOffset + Math.sin(x * w.freq + tick * w.speed) * w.amp + Math.cos(x * 0.001 + tick) * 35;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      } else if (effect === 'retro-synthwave') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#1c0338');
        bgGrad.addColorStop(0.52, '#3b0764');
        bgGrad.addColorStop(1, '#090117');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const horizonY = height * 0.52;
        const cx = width / 2;

        // Sol retro brillante
        const sunRadius = Math.min(width, height) * 0.18;
        const sunY = horizonY - sunRadius * 0.45;
        const sunGrad = ctx.createLinearGradient(cx, sunY - sunRadius, cx, sunY + sunRadius);
        sunGrad.addColorStop(0, '#fde047');
        sunGrad.addColorStop(0.5, '#f43f5e');
        sunGrad.addColorStop(1, '#c084fc');

        ctx.save();
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.arc(cx, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fillStyle = sunGrad;
        ctx.fill();

        // Franjas de corte horizontal en el sol
        ctx.fillStyle = '#1c0338';
        const stripeCount = 6;
        for (let i = 0; i < stripeCount; i++) {
          const sy = sunY + (i / stripeCount) * sunRadius;
          const sHeight = 2.5 + i * 1.5;
          ctx.fillRect(cx - sunRadius, sy, sunRadius * 2, sHeight);
        }
        ctx.restore();

        // Cuadrícula 3D en perspectiva
        ctx.save();
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 8;

        const lineCount = 30;
        for (let i = -lineCount; i <= lineCount; i++) {
          const bottomX = cx + (i * width) / (lineCount * 0.55);
          ctx.beginPath();
          ctx.moveTo(cx, horizonY);
          ctx.lineTo(bottomX, height);
          ctx.stroke();
        }

        const synthSpeed = (tick * 55) % 45;
        for (let y = 0; y < 16; y++) {
          const progress = Math.pow(y / 16, 2.2);
          const py = horizonY + progress * (height - horizonY) + (synthSpeed * (y / 16)) * 0.5;
          if (py >= horizonY && py <= height) {
            const alpha = Math.min(0.85, (py - horizonY) / (height - horizonY));
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(width, py);
            ctx.stroke();
          }
        }
        ctx.restore();
      } else if (effect === 'starfield') {
        // Espacio profundo con nebulosa
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) * 0.7);
        bgGrad.addColorStop(0, '#0c0728');
        bgGrad.addColorStop(0.6, '#060317');
        bgGrad.addColorStop(1, '#020108');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        ctx.save();
        stars.forEach((s) => {
          s.z -= 5;
          if (s.z <= 0) {
            s.z = width;
            s.x = (Math.random() - 0.5) * width * 2;
            s.y = (Math.random() - 0.5) * height * 2;
            s.pz = s.z;
          }

          const k = 260 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const size = Math.max(1, (1 - s.z / width) * 3.5);
            const alpha = Math.min(1, (1 - s.z / width) * 1.2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      } else if (effect === 'lofi-particles') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#1a0c05');
        bgGrad.addColorStop(0.6, '#281308');
        bgGrad.addColorStop(1, '#0f0602');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        lofiOrbs.forEach((orb) => {
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
          ctx.fillStyle = orb.color;
          ctx.globalAlpha = orb.alpha;
          ctx.shadowColor = orb.color;
          ctx.shadowBlur = 12;
          ctx.fill();

          orb.x += orb.vx;
          orb.y += orb.vy;

          if (orb.y < -orb.radius) {
            orb.y = height + orb.radius;
            orb.x = Math.random() * width;
          }
        });
        ctx.restore();
      } else if (effect === 'nordic-snow') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0c1524');
        bgGrad.addColorStop(0.5, '#162338');
        bgGrad.addColorStop(1, '#09101b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Halo de aurora ártica boreal en la cima
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const g = ctx.createLinearGradient(0, 0, 0, height * 0.4);
        g.addColorStop(0, 'rgba(136, 192, 208, 0.45)');
        g.addColorStop(0.5, 'rgba(129, 161, 193, 0.25)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height * 0.4);
        ctx.restore();

        // Copos de nieve flotantes
        ctx.save();
        snowflakes.forEach((s) => {
          s.y += s.speed;
          s.drift += 0.02;
          s.x += Math.sin(s.drift) * 0.8;

          if (s.y > height) {
            s.y = -s.radius;
            s.x = Math.random() * width;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224, 242, 254, ${s.alpha})`;
          ctx.shadowColor = '#88c0d0';
          ctx.shadowBlur = 6;
          ctx.fill();
        });
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentPresetId, preset.type, preset.canvasEffect]);

  // Si es modo OLED puro, renderizamos simplemente negro absoluto
  if (currentPresetId === 'oled-minimal') {
    return <div className="fixed inset-0 z-0 bg-black pointer-events-none" />;
  }

  // Estilo dinámico de blur y opacidad del fondo
  const containerStyle: React.CSSProperties = {
    opacity: opacity,
    filter: blur > 0 ? `blur(${blur}px)` : 'none',
    transform: blur > 0 ? 'scale(1.04)' : 'none'
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none transition-colors duration-700 bg-[#08080c]">
      {/* Halo cromático de acento Spicetify ambiental (Aura fluida) */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full blur-[180px] opacity-40 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: 'var(--spice-button)' }}
      />
      <div
        className="absolute -bottom-36 right-10 w-[800px] h-[600px] rounded-full blur-[160px] opacity-30 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: 'var(--spice-card)' }}
      />

      {/* 1. MODO SPICETIFY PURO O REACTIVO AL ÁLBUM */}
      {(currentPresetId === 'spicetify' || currentPresetId === 'reactive-album') && (
        <div
          className="absolute inset-0 transition-all duration-1000 ease-out flex items-center justify-center overflow-hidden"
          style={{
            ...containerStyle,
            background:
              currentPresetId === 'reactive-album' && ambientPalette
                ? ambientPalette.gradientCss
                : undefined
          }}
        >
          {currentTrack?.coverUrl && (
            <>
              {/* Aura ambiental difusa en alta saturación */}
              <img
                src={currentTrack.coverUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60 blur-3xl scale-125 saturate-200 transition-all duration-1000"
              />
              {/* Vinilo giratorio icónico estilo Spicetify Dribbblish */}
              <div
                className="relative w-96 h-96 rounded-full bg-[#111] shadow-[0_0_120px_rgba(0,0,0,0.9)] border border-white/20 flex items-center justify-center opacity-50 animate-spin"
                style={{ animationDuration: '24s' }}
              >
                <div className="absolute inset-4 rounded-full border border-white/10" />
                <div className="absolute inset-8 rounded-full border border-white/10" />
                <div className="absolute inset-12 rounded-full border border-white/10" />
                <div className="absolute inset-16 rounded-full border border-white/10" />
                <img
                  src={currentTrack.coverUrl}
                  alt=""
                  className="w-36 h-36 rounded-full object-cover shadow-inner border border-white/30"
                />
                <div className="absolute w-8 h-8 rounded-full bg-[#111] border border-white/40" />
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. MODO CANVAS ANIMADO PROCEDURAL (Siempre montado para garantizar ciclo de vida sin bloqueos) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          preset.type === 'animated-canvas' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={containerStyle}
      />

      {/* 3. MODO VIDEO EN BUCLE */}
      {preset.type === 'video-loop' && preset.backgroundUrl && (
        <video
          src={preset.backgroundUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={containerStyle}
        />
      )}

      {/* 4. MODO PERSONALIZADO (IMAGEN O VIDEO PROPIO DEL USUARIO) */}
      {currentPresetId === 'custom' && customUrl && (
        <>
          {customType === 'video-loop' || customUrl.endsWith('.mp4') || customUrl.endsWith('.webm') ? (
            <video
              src={customUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={containerStyle}
            />
          ) : (
            <img
              src={customUrl}
              alt="Custom background"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={containerStyle}
            />
          )}
        </>
      )}

      {/* Capa de contraste equilibrada */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
    </div>
  );
};

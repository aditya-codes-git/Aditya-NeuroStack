import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';

export const HalideLandingHero: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse Parallax Logic
    const handleMouseMove = (e: MouseEvent) => {
      const x = (window.innerWidth / 2 - e.pageX) / 25;
      const y = (window.innerHeight / 2 - e.pageY) / 25;

      // Rotate the 3D Canvas
      canvas.style.transform = `rotateX(${55 + y / 2}deg) rotateZ(${-25 + x / 2}deg)`;

      // Apply depth shift to layers
      layersRef.current.forEach((layer, index) => {
        if (!layer) return;
        const depth = (index + 1) * 15;
        const moveX = x * (index + 1) * 0.2;
        const moveY = y * (index + 1) * 0.2;
        layer.style.transform = `translateZ(${depth}px) translate(${moveX}px, ${moveY}px)`;
      });
    };

    // Entrance Animation
    canvas.style.opacity = '0';
    canvas.style.transform = 'rotateX(90deg) rotateZ(0deg) scale(0.8)';
    
    const timeout = setTimeout(() => {
      canvas.style.transition = 'all 2.5s cubic-bezier(0.16, 1, 0.3, 1)';
      canvas.style.opacity = '1';
      canvas.style.transform = 'rotateX(55deg) rotateZ(-25deg) scale(1)';
    }, 300);

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="halide-wrapper relative w-full h-screen overflow-hidden bg-bg-primary text-text-primary">
      <style>{`
        .halide-wrapper {
          --silver: #e8e8f0;
          --accent: #6c63ff;
          --grain-opacity: 0.2;
        }

        .halide-grain {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
          z-index: 100;
          opacity: var(--grain-opacity);
        }

        .viewport {
          perspective: 2000px;
          position: absolute;
          inset: 0;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          z-index: 1;
        }

        .canvas-3d {
          position: relative;
          width: 800px; height: 500px;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .layer {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(108, 99, 255, 0.2);
          background-size: cover;
          background-position: center;
          transition: transform 0.5s ease;
          border-radius: 20px;
        }

        /* Abstract digital dashboard vibe instead of purely natural landscapes */
        .layer-1 { background-image: url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200'); filter: grayscale(1) contrast(1.2) brightness(0.4); }
        .layer-2 { background-image: url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200'); filter: sepia(1) hue-rotate(200deg) contrast(1.1) brightness(0.6); opacity: 0.5; mix-blend-mode: color-dodge; }
        .layer-3 { background-image: url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200'); filter: grayscale(1) contrast(1.3) brightness(0.8); opacity: 0.3; mix-blend-mode: overlay; }

        .contours {
          position: absolute;
          width: 200%; height: 200%;
          top: -50%; left: -50%;
          background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 40px, rgba(108, 99, 255, 0.05) 41px, transparent 42px);
          transform: translateZ(120px);
          pointer-events: none;
        }

        .interface-grid {
          position: absolute;
          inset: 0;
          padding: 4rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto 1fr auto;
          z-index: 10;
          pointer-events: none;
        }

        .hero-title {
          grid-column: 1 / -1;
          align-self: center;
          font-size: clamp(3.5rem, 8vw, 8.5rem);
          line-height: 0.9;
          letter-spacing: -0.04em;
          font-weight: 800;
          text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .hero-highlight {
          color: transparent;
          -webkit-text-stroke: 2px var(--silver);
        }

        .cta-button {
          pointer-events: auto;
          background: var(--accent);
          color: white;
          padding: 1rem 2rem;
          text-decoration: none;
          font-weight: 600;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 20px rgba(108, 99, 255, 0.3);
        }

        .cta-button:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 0 30px rgba(108, 99, 255, 0.5);
          background: #8b83ff;
        }

        .secondary-btn {
          pointer-events: auto;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 1rem 2rem;
          text-decoration: none;
          font-weight: 600;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: 0.3s;
        }

        .secondary-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .scroll-hint {
          position: absolute;
          bottom: 2rem; left: 50%;
          width: 2px; height: 60px;
          background: linear-gradient(to bottom, var(--accent), transparent);
          animation: flow 2s infinite ease-in-out;
          z-index: 10;
        }

        @keyframes flow {
          0%, 100% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
        }

        @media (max-width: 768px) {
          .interface-grid {
            padding: 2rem;
            grid-template-columns: 1fr;
          }
          .hero-title {
            grid-column: 1;
            font-size: clamp(2.5rem, 6vw, 4rem);
          }
          .canvas-3d {
            width: 100%;
            height: 400px;
          }
          .top-right-meta {
            display: none;
          }
        }
      `}</style>

      {/* SVG Filter for Grain */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div className="halide-grain" style={{ filter: 'url(#hero-grain)' }}></div>

      <div className="viewport">
        <div className="canvas-3d" ref={canvasRef}>
          <div className="layer layer-1" ref={(el) => (layersRef.current[0] = el!)}></div>
          <div className="layer layer-2" ref={(el) => (layersRef.current[1] = el!)}></div>
          <div className="layer layer-3" ref={(el) => (layersRef.current[2] = el!)}></div>
          <div className="contours"></div>
        </div>
      </div>

      <div className="interface-grid">
        <div className="flex items-center gap-2 font-bold text-lg tracking-wider">
          <Zap className="w-5 h-5 text-primary" />
          CONTEXT_SWITCH
        </div>
        <div className="top-right-meta flex flex-col items-end text-right text-text-secondary text-sm max-w-xs justify-self-end">
          <p>ContextSwitch captures what you were doing, where you stopped, and what to do next — so you never lose focus.</p>
        </div>

        <h1 className="hero-title">
          DON'T START,<br />
          <span className="text-primary italic">BUT RESUME.</span>
        </h1>

        <div className="grid col-span-full grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="flex flex-col gap-2 font-mono text-xs text-text-muted">
            <p>[ NEURO-PRODUCTIVITY OS ]</p>
            <p>ELIMINATING CONTEXT SWITCHING COSTS</p>
          </div>
          <div className="flex items-center gap-4 justify-start md:justify-end pointer-events-auto">
            <button className="secondary-btn" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
              View Demo
            </button>
            <button className="cta-button" onClick={() => navigate('/auth')}>
              Start Session <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="scroll-hint"></div>
    </div>
  );
};

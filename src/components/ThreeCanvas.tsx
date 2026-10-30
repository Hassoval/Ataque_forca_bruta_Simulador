import { useEffect, useRef } from 'react';
import { CyberVaultScene } from '../three/CyberVaultScene';
import { SpeedId } from '../types/simulation';
import { Camera, Eye, Volume2, VolumeX } from 'lucide-react';

interface ThreeCanvasProps {
  currentPin: string;
  speedId: SpeedId;
  isAttacking: boolean;
  isMatched: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function ThreeCanvas({
  currentPin,
  speedId,
  isAttacking,
  isMatched,
  isMuted,
  onToggleMute,
}: ThreeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CyberVaultScene | null>(null);

  // Mount Three.js WebGL scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new CyberVaultScene({
      container: mountRef.current,
    });
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  // Update pin digits when currentPin or state changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updatePinDigits(currentPin, speedId, isAttacking);
    }
  }, [currentPin, speedId, isAttacking]);

  // Handle match unlock
  useEffect(() => {
    if (sceneRef.current) {
      if (isMatched) {
        sceneRef.current.triggerUnlock(currentPin);
      } else {
        sceneRef.current.resetLock();
      }
    }
  }, [isMatched, currentPin]);

  const handleResetCamera = () => {
    sceneRef.current?.resetCamera();
  };

  const handleRotorView = () => {
    sceneRef.current?.setRotorView();
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#050814]">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        data-testid="threejs-vault-canvas"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Subtle floating 3D camera & audio tools (top-right, unobtrusive) */}
      <aside aria-label="Controles da Câmera 3D" className="absolute top-20 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleResetCamera}
          title="Vista Geral do Cofre"
          aria-label="Vista Geral do Cofre 3D"
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 shadow-lg transition-all"
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          onClick={handleRotorView}
          title="Zoom nos Rotores Numéricos"
          aria-label="Zoom nos Rotores Criptográficos"
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 shadow-lg transition-all"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleMute}
          title={isMuted ? 'Ativar Efeitos Sonoros' : 'Desativar Áudio'}
          aria-label={isMuted ? 'Ativar Áudio Procedural' : 'Silenciar Áudio'}
          className={`p-2.5 rounded-xl border shadow-lg transition-all ${
            isMuted
              ? 'bg-slate-900/80 text-slate-500 border-slate-800'
              : 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </aside>

      {/* Orbit hint in bottom-left */}
      <div className="absolute bottom-28 left-4 z-10 pointer-events-none hidden md:flex items-center gap-2 text-xs text-slate-300/80 bg-slate-950/70 px-3 py-1.5 rounded-full border border-slate-800/70">
        <span className="w-2 h-2 rounded-full bg-cyan-500/80" />
        Arraste para orbitar o cofre 3D · Scroll para zoom
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Play, RotateCcw, ChevronDown, ChevronUp, Pause } from 'lucide-react';
import { SpeedId, SPEED_CONFIGS, SimulationStatus } from '../types/simulation';

interface ControlDockProps {
  selectedSpeed: SpeedId;
  onSelectSpeed: (speed: SpeedId) => void;
  status: SimulationStatus;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export default function ControlDock({
  selectedSpeed,
  onSelectSpeed,
  status,
  onStart,
  onStop,
  onReset,
}: ControlDockProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isRunning = status === 'running';

  const speeds: SpeedId[] = ['lenta', 'normal', 'rapida', 'extrema'];

  return (
    <nav
      aria-label="Painel de Controlo do Ataque"
      className="fixed bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-[94vw] sm:max-w-3xl flex flex-col items-center pointer-events-auto"
    >
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expandir Painel de Controlo' : 'Recolher Painel de Controlo'}
        className="mb-1.5 px-3 py-1 rounded-t-xl bg-[#070d1e]/90 hover:bg-slate-800 border-t border-x border-slate-700/80 text-xs font-mono text-slate-300 hover:text-cyan-400 flex items-center gap-1.5 shadow-md transition-all"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" /> ▴ Expandir Painel de Controlo
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" /> ▾ Ocultar Painel
          </>
        )}
      </button>

      {/* Main Dock Container */}
      <div
        className={`w-full bg-[#070d1e]/95 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl transition-all duration-300 ${
          isCollapsed ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex flex-col gap-3">
          {/* Header of dock: Selection title and helper */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span className="uppercase tracking-wider font-semibold text-slate-300">
              Escolha a Velocidade do Ataque:
            </span>
            <span className="text-[11px] text-slate-300/80 hidden sm:inline">
              Altera a taxa de processamento de combinações
            </span>
          </div>

          {/* 4 Speed Options (The ONLY configuration required) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {speeds.map((speedKey) => {
              const cfg = SPEED_CONFIGS[speedKey];
              const isSelected = selectedSpeed === speedKey;

              return (
                <button
                  key={speedKey}
                  type="button"
                  disabled={isRunning}
                  onClick={() => onSelectSpeed(speedKey)}
                  aria-pressed={isSelected}
                  className={`relative p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                    isRunning ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'
                  } ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{cfg.emoji}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-slate-100">
                    {cfg.rate.toLocaleString('pt-PT')} <span className="text-[10px] font-normal text-slate-400">tent./s</span>
                  </div>
                  <div className="text-[10px] text-slate-300/80 truncate mt-0.5 hidden xs:block">
                    {cfg.sublabel}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Execution Controls: Iniciar Simulação / Reiniciar */}
          <div className="flex items-center gap-2 pt-1">
            {isRunning ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Interromper Ataque"
                className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-600/30 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Pause className="w-4 h-4 fill-current" />
                INTERROMPER SIMULAÇÃO
              </button>
            ) : (
              <button
                type="button"
                onClick={onStart}
                aria-label="Iniciar Simulação"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/30 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-current" />
                INICIAR SIMULAÇÃO
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              aria-label="Reiniciar e Gerar Novo Alvo"
              title="Reiniciar e Gerar Novo Alvo Fictício"
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">NOVO ALVO</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

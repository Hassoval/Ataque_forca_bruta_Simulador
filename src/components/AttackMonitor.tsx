import { Clock, Gauge, Hash, KeyRound, Eye, EyeOff } from 'lucide-react';
import { SimulationStats, SimulationStatus } from '../types/simulation';
import { formatElapsedTime } from '../utils/simulationEngine';
import { useState } from 'react';

interface AttackMonitorProps {
  stats: SimulationStats;
  status: SimulationStatus;
}

export default function AttackMonitor({ stats, status }: AttackMonitorProps) {
  const [revealTarget, setRevealTarget] = useState(false);

  const currentDigits = stats.currentPin.padEnd(6, '0').slice(0, 6).split('');
  const targetDigits = stats.targetPin.padEnd(6, '0').slice(0, 6).split('');

  const isMatched = status === 'matched';
  const isRunning = status === 'running';

  return (
    <section aria-label="Monitor de Ataque em Tempo Real" className="relative z-20 w-full max-w-5xl mx-auto px-3 sm:px-4 pt-2 sm:pt-3 pb-1 pointer-events-auto">
      <div className="bg-[#070d1e]/90 border border-slate-800/90 rounded-2xl p-3 sm:p-5 shadow-2xl">
        {/* Top telemetry bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pb-2 sm:pb-3 mb-2 sm:mb-3 border-b border-slate-800/80">
          {/* Target PIN Preview (Didactic feature) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-300/80 mb-0.5 sm:mb-1">
              <span className="flex items-center gap-1 font-mono">
                <KeyRound className="w-3 h-3 text-amber-400" />
                ALVO
              </span>
              <button
                onClick={() => setRevealTarget(!revealTarget)}
                title={revealTarget ? 'Ocultar Senha' : 'Revelar Senha Alvo'}
                aria-label={revealTarget ? 'Ocultar Senha Alvo' : 'Revelar Senha Alvo'}
                className="text-slate-300 hover:text-slate-100 transition-colors"
              >
                {revealTarget ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono-cyber font-bold tracking-wider text-base sm:text-xl text-center">
              {isMatched || revealTarget ? (
                <span className="text-emerald-400">{stats.targetPin}</span>
              ) : (
                <span className="text-amber-400/80 tracking-widest">●●●●●●</span>
              )}
            </div>
          </div>

          {/* Attempts counter */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-3">
            <span className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-300/80 font-mono mb-0.5 sm:mb-1">
              <Hash className="w-3 h-3 text-cyan-400" />
              TENTATIVAS
            </span>
            <div className="font-mono-cyber font-bold text-base sm:text-xl text-cyan-300 text-center">
              {stats.attempts.toLocaleString('pt-PT')}
              <span className="text-[10px] sm:text-xs font-normal text-slate-400 ml-0.5">/1M</span>
            </div>
          </div>

          {/* Real-time speed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-3">
            <span className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-300/80 font-mono mb-0.5 sm:mb-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              VELOCIDADE
            </span>
            <div className="font-mono-cyber font-bold text-base sm:text-xl text-slate-100 text-center">
              {isRunning
                ? stats.effectiveSpeed.toLocaleString('pt-PT')
                : isMatched
                ? stats.effectiveSpeed.toLocaleString('pt-PT')
                : '0'}
              <span className="text-[10px] sm:text-xs font-normal text-slate-400 ml-0.5">t/s</span>
            </div>
          </div>

          {/* Elapsed time */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-3">
            <span className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-300/80 font-mono mb-0.5 sm:mb-1">
              <Clock className="w-3 h-3 text-purple-400" />
              TEMPO
            </span>
            <div className="font-mono-cyber font-bold text-base sm:text-xl text-purple-300 text-center">
              {formatElapsedTime(stats.elapsedMs)}
            </div>
          </div>
        </div>

        {/* Big Digit Combination Monitor (Projector Grade Display) */}
        <div className="text-center">
          <div className="text-[10px] sm:text-xs uppercase tracking-widest font-mono text-slate-400 mb-1 sm:mb-2">
            Combinação Atualmente Testada
          </div>

          <div
            className={`inline-flex items-center justify-center gap-1.5 sm:gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
              isMatched
                ? 'bg-emerald-950/40 border-emerald-500/70 glow-emerald'
                : isRunning
                ? 'bg-cyan-950/30 border-cyan-500/50 glow-cyan'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            {currentDigits.map((digit, idx) => (
              <div
                key={idx}
                className={`w-9 sm:w-16 md:w-20 h-12 sm:h-20 md:h-24 rounded-lg sm:rounded-xl flex items-center justify-center font-mono-cyber font-extrabold text-2xl sm:text-5xl md:text-6xl border shadow-inner transition-colors ${
                  isMatched
                    ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500/80'
                    : isRunning
                    ? 'bg-slate-900/90 text-cyan-300 border-cyan-600/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {digit}
              </div>
            ))}
          </div>

          {/* Match announcement pill */}
          {isMatched && (
            <div className="mt-1 text-[11px] sm:text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              ✓ Combinação correspondente encontrada no espaço de busca!
            </div>
          )}
        </div>

        {/* Progress Bar of Keyspace */}
        <div className="mt-2 sm:mt-3 pt-2 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-400 mb-1">
            <span>Progresso: {stats.percentage.toFixed(4)}%</span>
            <span className="hidden sm:inline">Espaço Total: 1.000.000 chaves</span>
          </div>
          <div className="w-full h-2 sm:h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-100 ${
                isMatched
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-500'
              }`}
              style={{ width: `${Math.max(1, stats.percentage)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

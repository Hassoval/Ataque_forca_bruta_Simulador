import { Shield, BookOpen, Maximize2, Minimize2, Terminal as TerminalIcon } from 'lucide-react';
import { SimulationStatus } from '../types/simulation';

interface HeaderNavProps {
  status: SimulationStatus;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenEducational: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
}

export default function HeaderNav({
  status,
  isFullscreen,
  onToggleFullscreen,
  onOpenEducational,
  onToggleTerminal,
  isTerminalOpen,
}: HeaderNavProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            ATAQUE EM CURSO
          </span>
        );
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            SENHA ENCONTRADA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            SISTEMA PRONTO
          </span>
        );
    }
  };

  return (
    <header className="relative z-30 w-full px-4 py-3 bg-[#070c1d]/90 border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold tracking-wider text-slate-100 font-mono-cyber">
                BRUTE FORCE <span className="text-cyan-400">LAB</span>
              </h1>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                v2.0 Académico
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs text-slate-400 hidden md:block">
                Simulação Académica · 6 Dígitos (10⁶)
              </p>
              <span className="hidden md:inline text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-semibold tracking-wide shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Desenvolvido por <span className="text-white font-bold underline decoration-cyan-400 decoration-2 underline-offset-2">Hassoval Dev</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center / Status */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            Espaço: <strong className="ml-1 text-slate-200">1.000.000 chaves</strong>
          </span>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTerminal}
            aria-label="Abrir Terminal de Eventos"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isTerminalOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 text-slate-300 hover:text-slate-100 border-slate-800 hover:border-slate-700'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Terminal</span>
          </button>

          <button
            onClick={onOpenEducational}
            aria-label="Conceitos e Defesas de Segurança"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-800/60 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Entropia &amp; Defesa</span>
          </button>

          <button
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Sair do Modo Ecrã Inteiro' : 'Modo Projetor Ecrã Inteiro'}
            title="Modo Projetor / Ecrã Inteiro"
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

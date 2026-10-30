import { CheckCircle2, ShieldAlert, Copy, Check, RotateCcw, X, KeyRound, Clock, Hash, Gauge, Percent } from 'lucide-react';
import { SimulationStats, SPEED_CONFIGS } from '../types/simulation';
import { formatElapsedTime } from '../utils/simulationEngine';
import { useState } from 'react';

interface ConclusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  stats: SimulationStats;
}

export default function ConclusionModal({ isOpen, onClose, onReset, stats }: ConclusionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const speedCfg = SPEED_CONFIGS[stats.speedId];

  const handleCopySummary = () => {
    const summary = `--- BRUTE FORCE LAB: RELATÓRIO ACADÉMICO ---
Desenvolvido por Hassoval Dev
Estado: ATAQUE CONCLUÍDO
Senha Fictícia Encontrada: ${stats.targetPin}
Tentativas Realizadas: ${stats.attempts.toLocaleString('pt-PT')} de 1.000.000
Velocidade Selecionada: ${speedCfg.label} (${speedCfg.rate.toLocaleString('pt-PT')} tent./s)
Velocidade Efetiva Medida: ${stats.effectiveSpeed.toLocaleString('pt-PT')} tent./s
Tempo de Execução: ${formatElapsedTime(stats.elapsedMs)}
Espaço de Chaves Percorrido: ${stats.percentage.toFixed(4)}%

Conclusão Académica:
Um espaço de 6 dígitos numéricos (10⁶ = 1.000.000) oferece baixa entropia. Sem mecanismos de mitigação como Rate Limiting, Bloqueio de Contas e MFA, é vulnerável a força bruta automatizada.`;

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conclusion-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-[#070d1e] border border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl glow-emerald my-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fechar Relatório"
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold uppercase tracking-wider border border-emerald-500/40">
                Ataque Concluído
              </span>
              <span className="text-xs text-slate-400 font-mono">Simulação Académica</span>
            </div>
            <h2 id="conclusion-title" className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono-cyber">
              Correspondência Encontrada!
            </h2>
          </div>
        </div>

        {/* Highlighted Cracked Password */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 mb-6 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400/80 mb-2 flex items-center justify-center gap-1.5">
            <KeyRound className="w-4 h-4" /> Senha Fictícia Decifrada
          </div>
          <div className="text-4xl sm:text-6xl font-extrabold font-mono-cyber text-emerald-300 tracking-wider">
            {stats.targetPin}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mb-1">
              <Hash className="w-3.5 h-3.5 text-cyan-400" /> TENTATIVAS
            </span>
            <div className="font-mono text-lg font-bold text-slate-100">
              {stats.attempts.toLocaleString('pt-PT')}
            </div>
            <span className="text-[10px] text-slate-300/80">de 1.000.000 chaves</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mb-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" /> VELOCIDADE
            </span>
            <div className="font-mono text-lg font-bold text-slate-100">
              {speedCfg.label}
            </div>
            <span className="text-[10px] text-slate-300/80">{speedCfg.rate.toLocaleString('pt-PT')} tent./s</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> TEMPO TOTAL
            </span>
            <div className="font-mono text-lg font-bold text-slate-100">
              {formatElapsedTime(stats.elapsedMs)}
            </div>
            <span className="text-[10px] text-slate-300/80">min:seg.cs</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mb-1">
              <Percent className="w-3.5 h-3.5 text-emerald-400" /> ESPAÇO
            </span>
            <div className="font-mono text-lg font-bold text-emerald-300">
              {stats.percentage.toFixed(4)}%
            </div>
            <span className="text-[10px] text-slate-300/80">do total explorado</span>
          </div>
        </div>

        {/* Academic Security Message */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 text-sm text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-xs sm:text-sm uppercase tracking-wider mb-2 font-mono">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Mensagem Académica de Segurança
          </div>
          <p className="text-slate-300 mb-3 text-xs sm:text-sm">
            A força bruta consiste em testar sistematicamente todas as combinações possíveis até encontrar uma credencial válida. 
            Quanto maior a velocidade de tentativa do atacante, menor o tempo necessário para quebrar a senha.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-0.5">1. Rate Limiting</span>
              Limitar a 5 tentativas/minuto torna o ataque inviável (levaria anos).
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-0.5">2. MFA / 2FA</span>
              O segundo fator impede o login mesmo que a senha seja descoberta.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-purple-400 font-bold block mb-0.5">3. Bloqueio de Conta</span>
              Travar temporariamente o acesso após 3 a 5 falhas consecutivas.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onReset}
            aria-label="Iniciar Nova Simulação com Outro Alvo"
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            NOVA SIMULAÇÃO
          </button>

          <button
            onClick={handleCopySummary}
            aria-label="Copiar Relatório da Simulação"
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Relatório</span>
              </>
            )}
          </button>
        </div>

        {/* Author signature footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-xs font-mono text-slate-400">
          Desenvolvido por <strong className="text-cyan-400 font-bold">Hassoval Dev</strong> · Laboratório Académico de Cibersegurança
        </div>
      </div>
    </div>
  );
}

import { X, BookOpen, ShieldCheck, Lock, Cpu, Server } from 'lucide-react';
import { getEntropyComparisons } from '../utils/simulationEngine';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EducationalModal({ isOpen, onClose }: EducationalModalProps) {
  if (!isOpen) return null;

  const comparisons = getEntropyComparisons();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edu-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-[#070d1e] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Fechar Guia de Segurança"
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-cyan-400 font-mono font-semibold uppercase tracking-wider">
              Conceito Teórico &amp; Mitigação
            </div>
            <h2 id="edu-modal-title" className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono-cyber">
              Como Funciona a Força Bruta?
            </h2>
          </div>
        </div>

        {/* Core explanation */}
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed mb-6">
          <p>
            Um ataque de <strong className="text-cyan-300">Força Bruta (Exhaustive Key Search)</strong> consiste na tentativa sistemática e exaustiva de todas as combinações possíveis de credenciais até que a correta seja aceite pelo sistema.
          </p>
          <p>
            Neste laboratório, o espaço de busca é de <strong className="text-white">6 dígitos numéricos (000000 a 999999)</strong>, totalizando exactamente <strong className="text-cyan-400 font-mono">1.000.000 (10⁶) de combinações</strong>. Computacionalmente, este espaço é trivial para computadores modernos caso não existam defesas.
          </p>
        </div>

        {/* Entropy Comparison Table */}
        <div className="mb-6">
          <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Tabela Comparativa de Entropia &amp; Tempo de Quebra
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Tipo de Segredo</th>
                  <th className="p-3">Espaço de Chaves</th>
                  <th className="p-3">Tempo a 1.000/s</th>
                  <th className="p-3">Tempo a 100.000/s</th>
                  <th className="p-3">Vulnerabilidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {comparisons.map((item, idx) => (
                  <tr key={idx} className={idx === 1 ? 'bg-cyan-950/30 font-semibold' : ''}>
                    <td className="p-3 text-slate-200">{item.type}</td>
                    <td className="p-3 text-cyan-300">{item.keyspace}</td>
                    <td className="p-3">{item.timeAt1kPerSec}</td>
                    <td className="p-3">{item.timeAt100kPerSec}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.vulnerability === 'Crítico'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.vulnerability === 'Muito Alto'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : item.vulnerability === 'Moderado'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.vulnerability}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fundamental Defenses */}
        <div className="space-y-3">
          <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Mecanismos Essenciais de Mitigação
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-cyan-400 mb-1">
                <Server className="w-4 h-4" />
                1. Rate Limiting / Token Bucket
              </div>
              <p className="text-slate-400 leading-relaxed">
                Limitar requisições de login por IP ou identificador de utilizador (ex: máximo de 5 tentativas por minuto). Com isso, testar 1.000.000 combinações demoraria mais de 3,8 anos.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                <Lock className="w-4 h-4" />
                2. Autenticação Multi-Fator (MFA)
              </div>
              <p className="text-slate-400 leading-relaxed">
                Adiciona um segundo elemento independente (código TOTP, chave FIDO2, push notification). Mesmo se o atacante descobrir o PIN de 6 dígitos, o acesso é barrado sem o token físico.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                <Cpu className="w-4 h-4" />
                3. Argon2id / bcrypt / PBKDF2
              </div>
              <p className="text-slate-400 leading-relaxed">
                Em caso de quebra de banco de dados offline, funções de hash lentas com custo computacional e de memória impedem o atacante de testar milhares de chaves por segundo com GPUs.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-purple-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                4. Bloqueio Temporário com Backoff
              </div>
              <p className="text-slate-400 leading-relaxed">
                Bloqueio após 3 a 5 falhas com atraso exponencial (1s, 2s, 4s, 8s, 15m), além de CAPTCHA adaptativo em caso de tráfego anómalo.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            aria-label="Entendido, Voltar à Simulação"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold transition-colors"
          >
            Voltar à Simulação
          </button>
        </div>
      </div>
    </div>
  );
}

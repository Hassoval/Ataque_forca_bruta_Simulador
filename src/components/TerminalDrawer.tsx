import { useEffect, useRef } from 'react';
import { Terminal, X, Copy, Check, Trash2 } from 'lucide-react';
import { LogEntry } from '../types/simulation';
import { useState } from 'react';

interface TerminalDrawerProps {
  logs: LogEntry[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export default function TerminalDrawer({ logs, isOpen, onClose, onClear }: TerminalDrawerProps) {
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new entries
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, isOpen]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `${l.timestamp} ${l.message}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Terminal de Eventos do Simulador"
      className="fixed inset-x-0 bottom-0 top-auto md:top-20 md:right-4 md:left-auto md:bottom-28 z-40 w-full md:w-[420px] max-h-[50vh] md:max-h-[60vh] bg-[#070c1d]/95 border border-slate-700/80 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md"
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">Terminal de Eventos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
            {logs.length} linhas
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyLogs}
            aria-label="Copiar Logs do Terminal"
            title="Copiar Logs"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            aria-label="Limpar Terminal"
            title="Limpar Terminal"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Fechar Terminal"
            title="Fechar Terminal"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Log Output List */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 bg-black/40">
        {logs.map((log) => {
          let colorClass = 'text-slate-300';
          if (log.type === 'match' || log.type === 'success') {
            colorClass = 'text-emerald-400 font-bold';
          } else if (log.type === 'alert') {
            colorClass = 'text-amber-400 font-medium';
          } else if (log.type === 'attempt') {
            colorClass = 'text-cyan-300/80';
          }

          return (
            <div key={log.id} className="leading-tight flex items-start gap-2">
              <span className="text-slate-400 select-none shrink-0">{log.timestamp}</span>
              <span className={colorClass}>{log.message}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </aside>
  );
}

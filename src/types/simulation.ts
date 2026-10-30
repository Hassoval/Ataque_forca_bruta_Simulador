export type SpeedId = 'lenta' | 'normal' | 'rapida' | 'extrema';

export interface SpeedConfig {
  id: SpeedId;
  label: string;
  emoji: string;
  rate: number; // Attempts per second
  sublabel: string;
  description: string;
  color: string;
}

export type SimulationStatus = 'idle' | 'running' | 'matched';

export interface SimulationStats {
  targetPin: string;
  currentPin: string;
  attempts: number;
  totalKeyspace: number;
  elapsedMs: number;
  percentage: number;
  effectiveSpeed: number; // Attempts per second measured
  speedId: SpeedId;
  startTime: number | null;
  endTime: number | null;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'system' | 'attempt' | 'match' | 'alert' | 'success';
}

export const SPEED_CONFIGS: Record<SpeedId, SpeedConfig> = {
  lenta: {
    id: 'lenta',
    label: 'LENTA',
    emoji: '🐢',
    rate: 10,
    sublabel: '10 tentativas/segundo',
    description: 'Permite aos alunos observar cada verificação individualmente.',
    color: 'emerald',
  },
  normal: {
    id: 'normal',
    label: 'NORMAL',
    emoji: '🚶',
    rate: 100,
    sublabel: '100 tentativas/segundo',
    description: 'Equivalente a scripts automatizados sem proteção de rate limit.',
    color: 'cyan',
  },
  rapida: {
    id: 'rapida',
    label: 'RÁPIDA',
    emoji: '⚡',
    rate: 1000,
    sublabel: '1.000 tentativas/segundo',
    description: 'Ataque em rede local ou API interna desprotegida.',
    color: 'amber',
  },
  extrema: {
    id: 'extrema',
    label: 'EXTREMA',
    emoji: '🚀',
    rate: 10000,
    sublabel: '10.000 tentativas/segundo',
    description: 'Quebra de hash offline com aceleração por GPU.',
    color: 'rose',
  },
};

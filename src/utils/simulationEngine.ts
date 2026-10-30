import { SpeedId } from '../types/simulation';

export const TOTAL_KEYSPACE = 1_000_000; // 000000 to 999999

/**
 * Format any integer to a 6-digit zero-padded PIN string
 */
export function formatPin(num: number): string {
  const bounded = Math.max(0, Math.min(TOTAL_KEYSPACE - 1, Math.floor(num)));
  return bounded.toString().padStart(6, '0');
}

/**
 * Generates an automatic 6-digit target PIN.
 * In classroom demonstration mode, pins are chosen within an engaging timeframe
 * (roughly 6 to 16 seconds of live observation for the chosen speed).
 */
export function generateTargetPin(speedId: SpeedId, mode: 'classroom' | 'full' = 'classroom'): string {
  if (mode === 'full') {
    const randomFull = Math.floor(Math.random() * TOTAL_KEYSPACE);
    return formatPin(randomFull);
  }

  // Demonstration ranges (seconds duration: ~6s - 16s)
  // Lenta (10/s)    => 60 - 150 attempts
  // Normal (100/s)  => 600 - 1,500 attempts
  // Rápida (1000/s) => 6,000 - 16,000 attempts
  // Extrema (10k/s) => 60,000 - 160,000 attempts
  const rangeConfig: Record<SpeedId, { min: number; max: number }> = {
    lenta: { min: 60, max: 150 },
    normal: { min: 600, max: 1500 },
    rapida: { min: 6000, max: 16000 },
    extrema: { min: 60000, max: 160000 },
  };

  const { min, max } = rangeConfig[speedId] || rangeConfig.normal;
  const targetNum = Math.floor(min + Math.random() * (max - min));
  return formatPin(targetNum);
}

/**
 * Calculate percentage of keyspace traversed
 */
export function calculatePercentage(attempts: number, total: number = TOTAL_KEYSPACE): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (attempts / total) * 100));
}

/**
 * Calculate effective speed (attempts / second)
 */
export function calculateEffectiveSpeed(attempts: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || attempts <= 0) return 0;
  return Math.round((attempts / elapsedMs) * 1000);
}

/**
 * Format milliseconds into HH:MM:SS.mmm or MM:SS.mmm
 */
export function formatElapsedTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((ms % 1000) / 10);

  const minStr = minutes.toString().padStart(2, '0');
  const secStr = seconds.toString().padStart(2, '0');
  const hunStr = hundredths.toString().padStart(2, '0');

  return `${minStr}:${secStr}.${hunStr}`;
}

/**
 * Format timestamp in [HH:MM:SS] format
 */
export function formatTimestamp(date: Date = new Date()): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `[${h}:${m}:${s}]`;
}

/**
 * Comparative Entropy Table for academic explanation
 */
export interface EntropyItem {
  type: string;
  keyspace: string;
  numericCombinations: number;
  timeAt1kPerSec: string;
  timeAt100kPerSec: string;
  vulnerability: 'Crítico' | 'Muito Alto' | 'Moderado' | 'Seguro';
}

export function getEntropyComparisons(): EntropyItem[] {
  return [
    {
      type: 'PIN de 4 Dígitos (0-9)',
      keyspace: '10⁴ = 10.000',
      numericCombinations: 10_000,
      timeAt1kPerSec: '10 segundos',
      timeAt100kPerSec: '0,1 segundos',
      vulnerability: 'Crítico',
    },
    {
      type: 'PIN de 6 Dígitos (Este Lab)',
      keyspace: '10⁶ = 1.000.000',
      numericCombinations: 1_000_000,
      timeAt1kPerSec: '16,6 minutos',
      timeAt100kPerSec: '10 segundos',
      vulnerability: 'Crítico',
    },
    {
      type: 'PIN de 8 Dígitos (0-9)',
      keyspace: '10⁸ = 100.000.000',
      numericCombinations: 100_000_000,
      timeAt1kPerSec: '27,7 horas',
      timeAt100kPerSec: '16,6 minutos',
      vulnerability: 'Muito Alto',
    },
    {
      type: 'Senha Alfanumérica (8 chars a-z, 0-9)',
      keyspace: '36⁸ ≈ 2,82 × 10¹²',
      numericCombinations: 2_821_109_907_456,
      timeAt1kPerSec: '89 anos',
      timeAt100kPerSec: '326 dias',
      vulnerability: 'Moderado',
    },
    {
      type: 'Complexa (12 chars a-z, A-Z, 0-9, símbolos)',
      keyspace: '94¹² ≈ 4,75 × 10²³',
      numericCombinations: 4.75e23,
      timeAt1kPerSec: '1,5 × 10¹³ anos',
      timeAt100kPerSec: '1,5 × 10¹¹ anos',
      vulnerability: 'Seguro',
    },
  ];
}

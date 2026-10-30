import { useState, useEffect, useRef, useCallback } from 'react';
import ThreeCanvas from './components/ThreeCanvas';
import HeaderNav from './components/HeaderNav';
import AttackMonitor from './components/AttackMonitor';
import ControlDock from './components/ControlDock';
import TerminalDrawer from './components/TerminalDrawer';
import ConclusionModal from './components/ConclusionModal';
import EducationalModal from './components/EducationalModal';
import { SpeedId, SPEED_CONFIGS, SimulationStats, SimulationStatus, LogEntry } from './types/simulation';
import {
  generateTargetPin,
  formatPin,
  calculatePercentage,
  calculateEffectiveSpeed,
  formatTimestamp,
  TOTAL_KEYSPACE,
} from './utils/simulationEngine';
import { soundFx } from './audio/soundEffects';

export default function App() {
  // Speed and target state
  const [selectedSpeed, setSelectedSpeed] = useState<SpeedId>('normal');
  const [targetPin, setTargetPin] = useState<string>(() => generateTargetPin('normal', 'classroom'));
  const [currentPin, setCurrentPin] = useState<string>('000000');
  const [attempts, setAttempts] = useState<number>(0);
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [effectiveSpeed, setEffectiveSpeed] = useState<number>(0);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => soundFx.getMuted());

  // UI Modals and drawers
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isConclusionOpen, setIsConclusionOpen] = useState<boolean>(false);
  const [isEducationalOpen, setIsEducationalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Event logs
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    {
      id: 'log-1',
      timestamp: formatTimestamp(),
      message: 'SIMULADOR INICIALIZADO · Desenvolvido por Hassoval Dev',
      type: 'system',
    },
    {
      id: 'log-2',
      timestamp: formatTimestamp(),
      message: 'ALVO FICTÍCIO GERADO [ESPAÇO: 1.000.000 COMBINAÇÕES]',
      type: 'system',
    },
    {
      id: 'log-3',
      timestamp: formatTimestamp(),
      message: 'AGUARDANDO SELEÇÃO DE VELOCIDADE...',
      type: 'system',
    },
  ]);

  // Mutable refs for high-frequency animation loop
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const currentAttemptRef = useRef<number>(0);
  const targetNumberRef = useRef<number>(0);
  const attemptAccumulatorRef = useRef<number>(0);
  const lastLogAttemptRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const selectedSpeedRef = useRef<SpeedId>(selectedSpeed);

  // Sync ref with state
  selectedSpeedRef.current = selectedSpeed;
  targetNumberRef.current = parseInt(targetPin, 10);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'system') => {
    setLogs((prev) => [
      ...prev.slice(-150), // keep last 150 items for DOM lightness
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatTimestamp(),
        message,
        type,
      },
    ]);
  }, []);

  // Update speed selection
  const handleSelectSpeed = (speedId: SpeedId) => {
    if (status === 'running') return;
    setSelectedSpeed(speedId);
    soundFx.playClick();
    addLog(`VELOCIDADE SELECIONADA: [${SPEED_CONFIGS[speedId].label} — ${SPEED_CONFIGS[speedId].sublabel}]`, 'system');

    // Regenerate tailored target for this speed so classroom demo duration is optimal
    const newTarget = generateTargetPin(speedId, 'classroom');
    setTargetPin(newTarget);
    targetNumberRef.current = parseInt(newTarget, 10);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  // Start Simulation
  const handleStart = () => {
    if (status === 'running') return;

    soundFx.playClick();
    setStatus('running');
    isRunningRef.current = true;
    setIsConclusionOpen(false);

    // If starting fresh or after a match
    if (status === 'matched' || currentAttemptRef.current >= targetNumberRef.current) {
      currentAttemptRef.current = 0;
      attemptAccumulatorRef.current = 0;
      lastLogAttemptRef.current = 0;
      setAttempts(0);
      setCurrentPin('000000');
      setElapsedMs(0);
    }

    const targetNum = targetNumberRef.current;
    const speedCfg = SPEED_CONFIGS[selectedSpeedRef.current];

    addLog(`ATAQUE INICIADO COM VELOCIDADE [${speedCfg.label} — ${speedCfg.rate.toLocaleString('pt-PT')} TENTATIVAS/SEG]`, 'alert');

    const startPerf = performance.now() - elapsedMs;
    startTimeRef.current = startPerf;
    let lastTickTime = performance.now();

    const loop = (now: number) => {
      if (!isRunningRef.current) return;

      const dt = (now - lastTickTime) / 1000;
      lastTickTime = now;

      const currentElapsed = Math.max(0, now - startPerf);
      setElapsedMs(currentElapsed);

      const rate = SPEED_CONFIGS[selectedSpeedRef.current].rate;
      attemptAccumulatorRef.current += rate * dt;

      const attemptsToAdvance = Math.floor(attemptAccumulatorRef.current);
      if (attemptsToAdvance > 0) {
        attemptAccumulatorRef.current -= attemptsToAdvance;
        currentAttemptRef.current += attemptsToAdvance;

        // Check if we hit or passed the target
        if (currentAttemptRef.current >= targetNum) {
          // TARGET FOUND!
          currentAttemptRef.current = targetNum;
          isRunningRef.current = false;
          setStatus('matched');

          const finalPinStr = formatPin(targetNum);
          setCurrentPin(finalPinStr);
          setAttempts(targetNum + 1);

          const finalElapsed = now - startPerf;
          setElapsedMs(finalElapsed);
          const finalSpeed = calculateEffectiveSpeed(targetNum + 1, finalElapsed);
          setEffectiveSpeed(finalSpeed);

          soundFx.playSuccessUnlock();

          addLog(`TENTATIVA: ${finalPinStr}`, 'attempt');
          addLog(`CORRESPONDÊNCIA ENCONTRADA: [${finalPinStr}]`, 'match');
          addLog(`SIMULAÇÃO CONCLUÍDA EM ${(finalElapsed / 1000).toFixed(2)}s (${finalSpeed} req/s)`, 'success');

          // Automatically reveal conclusion report after 600ms
          setTimeout(() => {
            setIsConclusionOpen(true);
          }, 600);

          return;
        }

        // Still running: update UI
        const currentPinStr = formatPin(currentAttemptRef.current);
        setCurrentPin(currentPinStr);
        setAttempts(currentAttemptRef.current);

        // Sound tick
        soundFx.playAttemptTick(selectedSpeedRef.current);

        // Calculate real-time effective rate
        const liveSpeed = calculateEffectiveSpeed(currentAttemptRef.current, currentElapsed);
        setEffectiveSpeed(liveSpeed);

        // Periodic terminal logging (rate-limited based on speed to avoid DOM choking)
        const logStep = rate >= 10000 ? 10000 : rate >= 1000 ? 1000 : rate >= 100 ? 100 : 5;
        if (currentAttemptRef.current - lastLogAttemptRef.current >= logStep) {
          lastLogAttemptRef.current = currentAttemptRef.current;
          addLog(`TENTATIVA: ${currentPinStr}`, 'attempt');
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  // Stop / Pause simulation
  const handleStop = () => {
    isRunningRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
    setStatus('idle');
    soundFx.playClick();
    addLog(`ATAQUE INTERROMPIDO PELO UTILIZADOR EM ${currentPin}`, 'alert');
  };

  // Reset & Generate New Target
  const handleReset = () => {
    isRunningRef.current = false;
    cancelAnimationFrame(animFrameRef.current);

    soundFx.playClick();
    setStatus('idle');
    setIsConclusionOpen(false);

    const newTarget = generateTargetPin(selectedSpeed, 'classroom');
    setTargetPin(newTarget);
    targetNumberRef.current = parseInt(newTarget, 10);

    currentAttemptRef.current = 0;
    attemptAccumulatorRef.current = 0;
    lastLogAttemptRef.current = 0;

    setCurrentPin('000000');
    setAttempts(0);
    setElapsedMs(0);
    setEffectiveSpeed(0);

    addLog('SIMULADOR REINICIADO', 'system');
    addLog('NOVO ALVO FICTÍCIO GERADO', 'system');
  };

  // Fullscreen toggle for classroom projector
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (status === 'running') handleStop();
        else handleStart();
      } else if (e.code === 'KeyR') {
        handleReset();
      } else if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'KeyT') {
        setIsTerminalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  // Autostart parameter support (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const timer = setTimeout(() => {
        handleStart();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const stats: SimulationStats = {
    targetPin,
    currentPin,
    attempts,
    totalKeyspace: TOTAL_KEYSPACE,
    elapsedMs,
    percentage: calculatePercentage(attempts, TOTAL_KEYSPACE),
    effectiveSpeed,
    speedId: selectedSpeed,
    startTime: startTimeRef.current,
    endTime: null,
  };

  return (
    <main
      data-testid="brute-force-lab-app"
      className="relative w-screen h-screen overflow-hidden bg-[#050814] text-slate-100 flex flex-col select-none"
    >
      {/* 1. Fullscreen Three.js 3D Cyber Vault Scene */}
      <ThreeCanvas
        currentPin={currentPin}
        speedId={selectedSpeed}
        isAttacking={status === 'running'}
        isMatched={status === 'matched'}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* 2. Top Header Navigation */}
      <HeaderNav
        status={status}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenEducational={() => setIsEducationalOpen(true)}
        onToggleTerminal={() => setIsTerminalOpen((prev) => !prev)}
        isTerminalOpen={isTerminalOpen}
      />

      {/* 3. Real-Time Telemetry & Big Digit Attack Monitor */}
      <AttackMonitor stats={stats} status={status} />

      {/* 4. Collapsible Bottom Control Dock (Speed Selection & Actions) */}
      <ControlDock
        selectedSpeed={selectedSpeed}
        onSelectSpeed={handleSelectSpeed}
        status={status}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
      />

      {/* 5. Terminal Drawer */}
      <TerminalDrawer
        logs={logs}
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onClear={() => setLogs([])}
      />

      {/* 6. Automatic Conclusion Modal on Password Match */}
      <ConclusionModal
        isOpen={isConclusionOpen}
        onClose={() => setIsConclusionOpen(false)}
        onReset={handleReset}
        stats={stats}
      />

      {/* 7. Educational Guide Modal (Entropy & Defenses) */}
      <EducationalModal
        isOpen={isEducationalOpen}
        onClose={() => setIsEducationalOpen(false)}
      />

      {/* Scanline CRT overlay for cyber atmosphere */}
      <div className="scanlines absolute inset-0 z-10 pointer-events-none opacity-40" />
    </main>
  );
}

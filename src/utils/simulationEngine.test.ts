import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPin,
  generateTargetPin,
  calculatePercentage,
  calculateEffectiveSpeed,
  formatElapsedTime,
  formatTimestamp,
  TOTAL_KEYSPACE,
} from './simulationEngine';

test('formatPin zero-pads numbers to 6 digits', () => {
  assert.equal(formatPin(0), '000000');
  assert.equal(formatPin(7), '000007');
  assert.equal(formatPin(42), '000042');
  assert.equal(formatPin(999999), '999999');
  assert.equal(formatPin(1000000), '999999'); // bounded
  assert.equal(formatPin(-5), '000000'); // bounded
});

test('generateTargetPin produces valid 6-digit strings within range', () => {
  for (const speed of ['lenta', 'normal', 'rapida', 'extrema'] as const) {
    const pin = generateTargetPin(speed, 'classroom');
    assert.equal(pin.length, 6);
    assert.match(pin, /^\d{6}$/);
    const num = parseInt(pin, 10);
    assert.ok(num >= 0 && num < TOTAL_KEYSPACE);
  }

  const fullPin = generateTargetPin('normal', 'full');
  assert.equal(fullPin.length, 6);
  assert.match(fullPin, /^\d{6}$/);
});

test('calculatePercentage correctly calculates keyspace portion', () => {
  assert.equal(calculatePercentage(0), 0);
  assert.equal(calculatePercentage(500000), 50);
  assert.equal(calculatePercentage(1000000), 100);
  assert.equal(calculatePercentage(10000), 1);
});

test('calculateEffectiveSpeed computes attempts per second', () => {
  assert.equal(calculateEffectiveSpeed(0, 1000), 0);
  assert.equal(calculateEffectiveSpeed(100, 1000), 100);
  assert.equal(calculateEffectiveSpeed(5000, 500), 10000);
});

test('formatElapsedTime formats ms to MM:SS.hundredths', () => {
  assert.equal(formatElapsedTime(0), '00:00.00');
  assert.equal(formatElapsedTime(1000), '00:01.00');
  assert.equal(formatElapsedTime(65230), '01:05.23');
});

test('formatTimestamp outputs brackets [HH:MM:SS]', () => {
  const ts = formatTimestamp(new Date());
  assert.match(ts, /^\[\d{2}:\d{2}:\d{2}\]$/);
});

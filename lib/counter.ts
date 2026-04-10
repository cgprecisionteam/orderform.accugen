import fs from 'fs';
import path from 'path';

const COUNTER_FILE = path.join(process.cwd(), 'data', 'counter.json');
const FY_PREFIX = '2627';

function readCounter(): number {
  try {
    const dir = path.dirname(COUNTER_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(COUNTER_FILE)) return 0;
    const raw = fs.readFileSync(COUNTER_FILE, 'utf-8');
    return JSON.parse(raw).count ?? 0;
  } catch {
    return 0;
  }
}

function writeCounter(count: number): void {
  const dir = path.dirname(COUNTER_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count }), 'utf-8');
}

export function generateRequestId(): string {
  const next = readCounter() + 1;
  writeCounter(next);
  const padded = String(next).padStart(5, '0');
  return `REQ-${FY_PREFIX}-${padded}`;
}

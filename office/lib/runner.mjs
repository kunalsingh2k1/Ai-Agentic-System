// Runs an agent through the Claude Code CLI in print mode, on the owner's Claude plan.
// Least privilege: each run gets only the tools its agent lists, no MCP servers, no session
// persistence, and an empty temp working directory (so no repo files or CLAUDE.md are in reach).
import { spawn, execFileSync } from 'node:child_process';
import { promises as fs, existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { InvalidOutput } from './agents.mjs';

export function findClaude() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  try {
    return execFileSync('which', ['claude'], { encoding: 'utf8' }).trim() || null;
  } catch { /* not on PATH */ }
  // The VS Code / Codespaces extension bundles the CLI.
  for (const base of ['.vscode-remote/extensions', '.vscode/extensions', '.vscode-server/extensions']) {
    const dir = path.join(os.homedir(), base);
    if (!existsSync(dir)) continue;
    const ext = readdirSync(dir).filter((d) => d.startsWith('anthropic.claude-code-')).sort().at(-1);
    const bin = ext && path.join(dir, ext, 'resources', 'native-binary', 'claude');
    if (bin && existsSync(bin)) return bin;
  }
  return null;
}

// Pulls the JSON object out of the model's reply, tolerating stray fences or prose.
export function extractJson(text) {
  const s = String(text || '').replace(/```(?:json)?/g, '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start < 0 || end <= start) throw new InvalidOutput('No JSON object in AI output');
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    throw new InvalidOutput('AI output was not valid JSON');
  }
}

export class ClaudeRunner {
  constructor({ bin = findClaude(), model = process.env.OFFICE_MODEL || '' } = {}) {
    this.bin = bin;
    this.model = model;
    this.kind = 'claude';
  }

  available() {
    return Boolean(this.bin);
  }

  async run(agent, prompt) {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'office-run-'));
    const tools = agent.tools.join(',');
    const args = ['-p', '--output-format', 'json', '--no-session-persistence', '--strict-mcp-config',
      '--permission-mode', 'dontAsk', '--tools', tools];
    if (tools) args.push('--allowedTools', tools);
    if (this.model) args.push('--model', this.model);
    try {
      const raw = await spawnWithTimeout(this.bin, args, prompt, cwd, agent.timeoutMs);
      let envelope;
      try {
        envelope = JSON.parse(raw);
      } catch {
        throw new Error('Claude CLI returned an unreadable response');
      }
      if (envelope.is_error) throw new Error(String(envelope.result || envelope.subtype || 'Claude run failed').slice(0, 300));
      return { text: envelope.result, costUsd: envelope.total_cost_usd ?? null };
    } finally {
      fs.rm(cwd, { recursive: true, force: true }).catch(() => {});
    }
  }
}

function spawnWithTimeout(bin, args, input, cwd, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000).unref();
      reject(new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 || out.trim().startsWith('{')) resolve(out);
      else reject(new Error(`Claude CLI exited with code ${code}: ${err.trim().slice(0, 300)}`));
    });
    child.stdin.end(input);
  });
}

// Deterministic stand-in for tests and demo mode. Never calls a model.
export class MockRunner {
  constructor() {
    this.kind = 'mock';
    this.calls = [];
  }

  available() {
    return true;
  }

  async run(agent, prompt) {
    this.calls.push({ agent: agent.label, prompt });
    const fixtures = {
      'AI Manager': { tasks: [
        { task: 'Write an Instagram carousel on GST due dates', priority: 'High', owner: 'Content Agent', deadline: '', notes: 'Hinglish, 6 slides', skill: 'social' },
        { task: 'Research boutiques in Uttam Nagar', priority: 'Medium', owner: 'Research Agent', deadline: '', notes: '', skill: 'prospecting' },
      ] },
      'Content Agent': { title: 'GST due dates carousel', platform: 'Instagram', body: 'GST ki due date yaad hai? GSTR-1: 11th · GSTR-3B: 20th. Hum yaad rakhte hain. WhatsApp karein.', visual: 'Slide 1: hook', unsure: ['Verify QRMP dates'] },
      'Quality Checker': { decision: 'approve', issues: [], suggested_revision: '' },
      'Research Agent': { leads: [
        { business_name: 'Example Boutique', website: 'https://example.com', niche: 'Boutique', area: 'Uttam Nagar', source_url: 'https://example.com/about', public_contact: '', fit_reason: 'New shop listing' },
        { business_name: 'No Source Traders', website: '', niche: 'Trader', area: 'Palam', source_url: '', fit_reason: 'Missing source, must be dropped' },
      ] },
      'Follow-up Agent': { title: 'Intro message', platform: 'WhatsApp', body: 'Namaste! Kya aapki GST filing time pe ho rahi hai?', unsure: [] },
    };
    return { text: JSON.stringify(fixtures[agent.label] ?? {}), costUsd: 0 };
  }
}

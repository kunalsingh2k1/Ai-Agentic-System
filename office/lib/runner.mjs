// Runs an agent through the Claude Code CLI in print mode, on the owner's Claude plan.
// Least privilege: each run gets only the tools its agent lists, no MCP servers and no session
// persistence. Read-only agents run in an empty temp dir. Edit agents (agent.edit) run in the
// brand folder in --restricted mode (no command tools, file tools confined to that folder) with
// office/ and data/ denied.
import { spawn, execFileSync } from 'node:child_process';
import { promises as fs, existsSync, readdirSync } from 'node:fs';
import { EDIT_DENY } from './agents.mjs';
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

  async run(agent, prompt, { cwd: workDir } = {}) {
    if (agent.edit && !workDir) throw new Error('Edit agents need a working directory');
    const cwd = agent.edit ? workDir : await fs.mkdtemp(path.join(os.tmpdir(), 'office-run-'));
    const tools = agent.tools.join(',');
    const args = ['-p', '--output-format', 'json', '--no-session-persistence', '--strict-mcp-config',
      '--permission-mode', 'dontAsk', '--tools', tools];
    if (tools) args.push('--allowedTools', tools);
    if (agent.edit) args.push('--restricted', '--disallowedTools', ...EDIT_DENY);
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
      if (!agent.edit) fs.rm(cwd, { recursive: true, force: true }).catch(() => {});
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

  async run(agent, prompt, { cwd } = {}) {
    this.calls.push({ agent: agent.label, prompt, cwd });
    if (agent.label === 'Skill Worker') {
      // Simulates a worker saving a deliverable, so snapshot/undo can be tested.
      await fs.mkdir(path.join(cwd, '04-content'), { recursive: true });
      await fs.writeFile(path.join(cwd, '04-content', 'mock-deliverable.md'), '# Mock deliverable\n');
      await fs.appendFile(path.join(cwd, 'LOG.md'), 'mock · worker · 04-content/mock-deliverable.md\n');
      return { text: JSON.stringify({ summary: 'Wrote the mock deliverable.', files: ['04-content/mock-deliverable.md'], next_actions: ['Review it'], unsure: [] }), costUsd: 0 };
    }
    const fixtures = {
      'AI Manager': { tasks: [
        { task: 'Write an Instagram carousel on GST due dates', priority: 'High', owner: 'Content Agent', deadline: '', notes: 'Hinglish, 6 slides', skill: 'hub/social' },
        { task: 'Research boutiques in Uttam Nagar', priority: 'Medium', owner: 'Research Agent', deadline: '', notes: '', skill: 'prospecting' },
      ] },
      'Content Agent': { title: 'GST due dates carousel', platform: 'Instagram', body: 'GST ki due date yaad hai? GSTR-1: 11th · GSTR-3B: 20th. Hum yaad rakhte hain. WhatsApp karein.', visual: 'Slide 1: hook', unsure: ['Verify QRMP dates'] },
      'Quality Checker': { decision: 'approve', issues: [], suggested_revision: '' },
      'Research Agent': { leads: [
        { business_name: 'Example Boutique', website: 'https://example.com', niche: 'Boutique', area: 'Uttam Nagar', source_url: 'https://example.com/about', public_contact: '', fit_reason: 'New shop listing' },
        { business_name: 'No Source Traders', website: '', niche: 'Trader', area: 'Palam', source_url: '', fit_reason: 'Missing source, must be dropped' },
      ] },
      Orchestrator: { title: 'Content sprint', steps: [
        { title: 'Plan the month', agent: 'worker', skill: 'hub/social', instructions: 'Make the calendar', depends_on: [] },
        { title: 'Find leads', agent: 'research', skill: 'hub/prospecting', instructions: '', niche: 'boutiques', area: 'Uttam Nagar', depends_on: [] },
        { title: 'Research without area is dropped', agent: 'research', skill: 'hub/prospecting', depends_on: [] },
        { title: 'Write the first post', agent: 'content', skill: 'hub/social', platform: 'Instagram', instructions: 'Use step 1', depends_on: [1] },
      ] },
      'Follow-up Agent': { title: 'Intro message', platform: 'WhatsApp', body: 'Namaste! Kya aapki GST filing time pe ho rahi hai?', unsure: [] },
    };
    return { text: JSON.stringify(fixtures[agent.label] ?? {}), costUsd: 0 };
  }
}

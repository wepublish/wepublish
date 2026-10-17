import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import os from 'node:os';
import autocannon from 'autocannon';

const DURATION = Number(process.env.DURATION ?? 10);
const CONNECTIONS = Number(process.env.CONNECTIONS ?? 50);
const ROUNDS = Number(process.env.ROUNDS ?? 5);
const WARMUP = Number(process.env.WARMUP ?? 3);

const ALL_ADAPTERS = [
  {
    key: 'express',
    label: '@nestjs/platform-express',
    script: 'server-express.ts',
    port: 4101,
    stack: 'wepublish',
  },
  {
    key: 'node',
    label: '@nestjs/platform-node',
    script: 'server-node.ts',
    port: 4102,
    stack: 'wepublish',
  },
  {
    key: 'express-bare',
    label: '@nestjs/platform-express (bare)',
    script: 'server-express-bare.ts',
    port: 4103,
    stack: 'bare',
  },
  {
    key: 'node-bare',
    label: '@nestjs/platform-node (bare)',
    script: 'server-node-bare.ts',
    port: 4104,
    stack: 'bare',
  },
];

const ADAPTERS =
  process.env.BARE === '0' ?
    ALL_ADAPTERS.filter((a) => a.stack === 'wepublish')
  : ALL_ADAPTERS;

const SCENARIOS = [
  {
    key: 'health',
    label: 'GET /health',
    description: 'Tiny JSON response. Isolates per-request adapter overhead.',
    req: (base) => ({ url: `${base}/health` }),
  },
  {
    key: 'route-param',
    label: 'GET /articles/:id',
    description: 'Route-parameter matching plus a small JSON body.',
    req: (base) => ({ url: `${base}/articles/42` }),
  },
  {
    key: 'json-body',
    label: 'POST /echo',
    description: 'JSON request body parsing (body-parser vs built-in parser).',
    req: (base) => ({
      url: `${base}/echo`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'A new article',
        tags: ['news', 'local'],
        draft: true,
      }),
    }),
  },
  {
    key: 'large-payload',
    label: 'GET /payload',
    description:
      '~45KB JSON response. Serialization-dominated; adapters converge.',
    req: (base) => ({ url: `${base}/payload` }),
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(adapter) {
  const child = spawn('npx', ['tsx', adapter.script], {
    cwd: import.meta.dirname,
    env: { ...process.env, PORT: String(adapter.port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  let exited = null;
  child.stderr.on('data', (d) => (stderr += d.toString()));
  child.on('exit', (code) => (exited = code));

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (exited !== null) {
      throw new Error(`${adapter.key} exited early (${exited})\n${stderr}`);
    }
    try {
      const res = await fetch(`http://127.0.0.1:${adapter.port}/health`);
      if (res.ok) {
        await res.text();
        return child;
      }
    } catch {
      /* not listening yet */
    }
    await sleep(300);
  }
  child.kill('SIGKILL');
  throw new Error(`${adapter.key} did not become ready\n${stderr}`);
}

function run(opts, duration) {
  return autocannon({ connections: CONNECTIONS, duration, ...opts });
}

async function verify(adapter) {
  const base = `http://127.0.0.1:${adapter.port}`;
  for (const s of SCENARIOS) {
    const o = s.req(base);
    const res = await fetch(o.url, {
      method: o.method ?? 'GET',
      headers: o.headers,
      body: o.body,
    });
    if (!res.ok) {
      throw new Error(`${adapter.key} ${s.label} -> HTTP ${res.status}`);
    }
    const len = (await res.text()).length;
    console.log(
      `  ${adapter.key.padEnd(14)} ${s.label.padEnd(20)} ${res.status} ${len}B`
    );
  }
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function main() {
  console.log('Booting servers...');
  const servers = {};
  for (const a of ADAPTERS) servers[a.key] = await startServer(a);

  console.log('Verifying endpoints:');
  for (const a of ADAPTERS) await verify(a);

  console.log(`\nWarmup (${WARMUP}s per adapter/scenario)...`);
  for (const a of ADAPTERS) {
    for (const s of SCENARIOS) {
      await run(s.req(`http://127.0.0.1:${a.port}`), WARMUP);
    }
  }

  const results = {};
  for (const a of ADAPTERS) {
    results[a.key] = {};
    for (const s of SCENARIOS) results[a.key][s.key] = [];
  }

  for (let round = 1; round <= ROUNDS; round++) {
    for (const s of SCENARIOS) {
      const order = round % 2 === 0 ? [...ADAPTERS].reverse() : ADAPTERS;
      for (const a of order) {
        const r = await run(s.req(`http://127.0.0.1:${a.port}`), DURATION);
        results[a.key][s.key].push({
          rps: r.requests.average,
          latencyMean: r.latency.average,
          latencyP99: r.latency.p99,
          throughput: r.throughput.average,
          non2xx: r.non2xx,
          errors: r.errors,
        });
        console.log(
          `round ${round} ${s.key.padEnd(14)} ${a.key.padEnd(14)} ` +
            `${r.requests.average.toFixed(0).padStart(7)} rps  ` +
            `p99 ${r.latency.p99.toFixed(2).padStart(6)}ms  ` +
            `non2xx=${r.non2xx} err=${r.errors}`
        );
      }
    }
  }

  const summary = { scenarios: {} };
  for (const s of SCENARIOS) {
    const entry = { label: s.label, description: s.description, adapters: {} };
    for (const a of ADAPTERS) {
      const rows = results[a.key][s.key];
      entry.adapters[a.key] = {
        label: a.label,
        rps: median(rows.map((r) => r.rps)),
        latencyMean: median(rows.map((r) => r.latencyMean)),
        latencyP99: median(rows.map((r) => r.latencyP99)),
        throughput: median(rows.map((r) => r.throughput)),
        non2xx: rows.reduce((t, r) => t + r.non2xx, 0),
        errors: rows.reduce((t, r) => t + r.errors, 0),
        rounds: rows,
      };
    }
    const pct = (from, to) => ((to - from) / from) * 100;
    entry.deltaPct = pct(entry.adapters.express.rps, entry.adapters.node.rps);
    if (entry.adapters['express-bare']) {
      entry.deltaBarePct = pct(
        entry.adapters['express-bare'].rps,
        entry.adapters['node-bare'].rps
      );
      entry.expressMiddlewareCostPct = pct(
        entry.adapters['express-bare'].rps,
        entry.adapters.express.rps
      );
      entry.nodeMiddlewareCostPct = pct(
        entry.adapters['node-bare'].rps,
        entry.adapters.node.rps
      );
    }
    summary.scenarios[s.key] = entry;
  }

  summary.config = {
    duration: DURATION,
    connections: CONNECTIONS,
    rounds: ROUNDS,
    warmup: WARMUP,
  };
  summary.env = {
    node: process.version,
    platform: `${os.platform()} ${os.release()}`,
    arch: os.arch(),
    cpu: os.cpus()[0]?.model,
    cores: os.cpus().length,
    memoryGB: Math.round(os.totalmem() / 1024 ** 3),
  };

  writeFileSync(
    new URL('./results.json', import.meta.url),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n=== MEDIAN RESULTS ===');
  for (const s of SCENARIOS) {
    const e = summary.scenarios[s.key];
    const line = (k) =>
      e.adapters[k] ? `${k} ${e.adapters[k].rps.toFixed(0).padStart(7)} rps` : '';
    console.log(
      `${s.label.padEnd(20)} ${line('express')} | ${line('node')} | ` +
        `${e.deltaPct >= 0 ? '+' : ''}${e.deltaPct.toFixed(1)}%` +
        (e.deltaBarePct !== undefined ?
          `   [bare: ${line('express-bare')} | ${line('node-bare')} | ` +
          `${e.deltaBarePct >= 0 ? '+' : ''}${e.deltaBarePct.toFixed(1)}%]`
        : '')
    );
  }

  for (const a of ADAPTERS) servers[a.key].kill('SIGKILL');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

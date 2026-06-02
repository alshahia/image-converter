import { useCallback, useEffect, useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'exec-running' | 'done' | 'error';

interface Result {
  loaded: boolean;
  ffmpegVersion: string | null;
  execOutput: string[];
  durationMs: number | null;
  error: string | null;
}

export function FfmpegSmokePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<Result>({
    loaded: false,
    ffmpegVersion: null,
    execOutput: [],
    durationMs: null,
    error: null,
  });

  const run = useCallback(async () => {
    setStatus('loading');
    setResult({
      loaded: false,
      ffmpegVersion: null,
      execOutput: [],
      durationMs: null,
      error: null,
    });
    const start = performance.now();

    try {
      const { getFFmpeg } = await import('../lib/engines/ffmpeg');
      const ffmpeg = await getFFmpeg();

      const logLines: string[] = [];
      const logHandler = ({ message }: { message: string }) => {
        logLines.push(message);
      };
      ffmpeg.on('log', logHandler);

      setStatus('exec-running');

      await ffmpeg.exec(['-version']);

      ffmpeg.off('log', logHandler);

      const versionLine = logLines.find((l) => l.startsWith('ffmpeg version')) ?? null;
      const duration = performance.now() - start;

      setResult({
        loaded: true,
        ffmpegVersion: versionLine,
        execOutput: logLines.slice(0, 20),
        durationMs: Math.round(duration),
        error: null,
      });
      setStatus('done');
    } catch (err) {
      setResult({
        loaded: false,
        ffmpegVersion: null,
        execOutput: [],
        durationMs: null,
        error: err instanceof Error ? err.message : String(err),
      });
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">ffmpeg.wasm smoke test</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Internal diagnostic. Verifies that ffmpeg.wasm loads from{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            /ffmpeg/
          </code>{' '}
          and that a no-op{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            ffmpeg -version
          </code>{' '}
          command runs to completion.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Status</h2>
          <StatusBadge status={status} />
        </div>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <Field label="Loaded" value={result.loaded ? 'yes' : 'no'} />
          <Field label="ffmpeg version" value={result.ffmpegVersion ?? '—'} mono />
          <Field
            label="Total time"
            value={result.durationMs != null ? `${result.durationMs} ms` : '—'}
          />
          <Field label="Log lines" value={String(result.execOutput.length)} />
        </dl>
        {result.error && (
          <pre className="mt-3 overflow-auto rounded bg-red-50 p-3 text-xs text-red-900 dark:bg-red-950 dark:text-red-100">
            {result.error}
          </pre>
        )}
      </section>

      {result.execOutput.length > 0 && (
        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-2 font-semibold">ffmpeg log (first 20 lines)</h2>
          <pre className="overflow-auto rounded bg-neutral-50 p-3 text-xs dark:bg-neutral-950">
            {result.execOutput.join('\n')}
          </pre>
        </section>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={run}
          disabled={status === 'loading' || status === 'exec-running'}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {status === 'loading' || status === 'exec-running' ? 'Running…' : 'Re-run'}
        </button>
        <a
          href="/"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Back to home
        </a>
      </div>

      <Checklist status={status} result={result} />
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    idle: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    loading: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    'exec-running': 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    ready: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    done: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    error: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
  };
  const label: Record<Status, string> = {
    idle: 'Idle',
    loading: 'Loading core…',
    'exec-running': 'Running exec…',
    ready: 'Ready',
    done: 'Pass',
    error: 'Fail',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {label[status]}
    </span>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</dd>
    </div>
  );
}

function Checklist({ status, result }: { status: Status; result: Result }) {
  const checks = [
    {
      label: 'Page served with COOP=same-origin + COEP=require-corp',
      ok: typeof window !== 'undefined' && window.crossOriginIsolated === true,
      hint: 'Open DevTools → Console and check: crossOriginIsolated === true',
    },
    {
      label: 'ffmpeg-core.js reachable at /ffmpeg/ffmpeg-core.js',
      ok: result.loaded || result.error?.includes('ffmpeg-core') === false,
      hint: 'Open DevTools → Network and verify 200 on /ffmpeg/ffmpeg-core.js',
    },
    {
      label: 'ffmpeg-core.wasm reachable at /ffmpeg/ffmpeg-core.wasm',
      ok: result.loaded,
      hint: 'Open DevTools → Network and verify 200 on /ffmpeg/ffmpeg-core.wasm',
    },
    {
      label: 'ffmpeg -version command executed',
      ok: status === 'done' && result.ffmpegVersion !== null,
      hint: 'If failed, see error above. Common cause: COEP block on a third-party resource.',
    },
  ];

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-2 font-semibold">Pass criteria</h2>
      <ul className="space-y-2 text-sm">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            <span className={c.ok ? 'text-emerald-600' : 'text-neutral-400'}>
              {c.ok ? '✓' : '○'}
            </span>
            <div>
              <p>{c.label}</p>
              {!c.ok && c.hint && <p className="text-xs text-neutral-500">{c.hint}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

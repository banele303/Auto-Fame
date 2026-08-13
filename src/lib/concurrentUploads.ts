export interface UploadResult {
  file: File;
  success: boolean;
  attempts: number;
  error?: any;
  responseStatus?: number;
}

export interface ConcurrentUploadOptions {
  concurrency?: number;    // parallel uploads (default 2 for reliability)
  retries?: number;        // additional attempts after first failure
  baseDelayMs?: number;    // base delay for exponential backoff
  timeoutMs?: number;      // per-file upload timeout in ms (default 60s)
  onProgress?: (progress: {
    total: number;
    completed: number;
    success: number;
    failed: number;
    inFlight: number;
    currentFile?: string;
  }) => void;
  onFileStart?: (file: File, attempt: number) => void;
  onFileSuccess?: (file: File, attempt: number) => void;
  onFileFailure?: (file: File, attempt: number, error: any) => void;
}

/**
 * Runs uploads with limited concurrency, retry + exponential backoff, and per-file timeout.
 * Designed to reliably handle 34+ photo uploads to S3.
 */
export async function concurrentUpload(
  files: File[],
  worker: (file: File, signal: AbortSignal) => Promise<Response | void>,
  opts: ConcurrentUploadOptions = {}
): Promise<UploadResult[]> {
  const concurrency = Math.max(1, opts.concurrency || 2);
  const retries = Math.max(0, opts.retries ?? 3);
  const baseDelayMs = opts.baseDelayMs ?? 500;
  const timeoutMs = opts.timeoutMs ?? 60_000;   // 60s per file
  const queue = [...files];
  const results: UploadResult[] = [];
  let inFlight = 0;
  let completed = 0;
  let success = 0;
  let failed = 0;

  const report = (currentFile?: string) => {
    opts.onProgress?.({ total: files.length, completed, success, failed, inFlight, currentFile });
  };

  async function runSingle(file: File) {
    let attempt = 0;
    while (attempt <= retries) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        opts.onFileStart?.(file, attempt);
        const res = await worker(file, controller.signal);
        clearTimeout(timer);

        const ok = !res || (res as Response).ok;
        if (!ok) {
          const status = (res as Response).status;
          if (attempt <= retries) {
            opts.onFileFailure?.(file, attempt, new Error(`HTTP ${status}`));
            await backoff(attempt);
            continue;
          }
          failed++; completed++;
          results.push({ file, success: false, attempts: attempt, responseStatus: status, error: `HTTP ${status}` });
          report();
          return;
        }
        success++; completed++;
        opts.onFileSuccess?.(file, attempt);
        results.push({ file, success: true, attempts: attempt, responseStatus: (res as Response | undefined)?.status });
        report();
        return;
      } catch (err: any) {
        clearTimeout(timer);
        const isAbort = err?.name === 'AbortError' || controller.signal.aborted;
        const label = isAbort ? 'Timeout' : (err?.message || 'Network error');

        if (attempt <= retries) {
          opts.onFileFailure?.(file, attempt, new Error(label));
          await backoff(attempt);
          continue;
        }
        failed++; completed++;
        results.push({ file, success: false, attempts: attempt, error: label });
        report();
        return;
      }
    }
  }

  function backoff(attempt: number) {
    // Exponential backoff with jitter
    const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
    return new Promise(r => setTimeout(r, delay));
  }

  return await new Promise<UploadResult[]>((resolve) => {
    function launchNext() {
      if (queue.length === 0) {
        if (inFlight === 0) {
          resolve(results);
        }
        return;
      }
      while (inFlight < concurrency && queue.length) {
        const file = queue.shift()!;
        inFlight++; report(file.name);
        runSingle(file).finally(() => { inFlight--; launchNext(); });
      }
    }
    launchNext();
  });
}

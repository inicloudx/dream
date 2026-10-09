// Waits until a /health address answers 200 — and, if a version is given, until it reports that version —
// or fails after a timeout. Used by the pipeline after a deploy: the old version keeps answering while the new
// one starts, so "healthy" alone would pass too early. A release only counts once the NEW version is up.
// Usage: node scripts/wait-healthy.mjs <url> [timeoutSeconds] [expectedVersion]
const [url, timeoutArg, expectedVersion] = process.argv.slice(2);
if (!url) {
  console.error('Usage: node scripts/wait-healthy.mjs <url> [timeoutSeconds] [expectedVersion]');
  process.exit(2);
}

const deadline = Date.now() + Number(timeoutArg ?? 300) * 1000;

// Ends by setting process.exitCode rather than calling process.exit(), so Node can close its network handles
// cleanly (forcing the exit tripped an internal assertion on Windows).
async function waitUntilHealthy() {
  for (let attempt = 1; ; attempt++) {
    let status = 'no answer';
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      status = String(res.status);
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (!expectedVersion || body.version === expectedVersion) {
          console.log(`Healthy after ${attempt} attempt(s): ${url} → ${status}, version ${body.version ?? 'unknown'}`);
          return 0;
        }
        status = `${status} but still version ${body.version ?? 'unknown'}, waiting for ${expectedVersion}`;
      }
    } catch (err) {
      status = err instanceof Error ? err.message : String(err);
    }
    if (Date.now() > deadline) {
      console.error(`Not healthy in time: ${url} → ${status}. Check the app's Log stream.`);
      return 1;
    }
    console.log(`Attempt ${attempt}: ${status}, retrying in 10 s…`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
}

process.exitCode = await waitUntilHealthy();

// Waits until a /health address answers 200, or fails after a timeout.
// Used by the pipeline after a deploy: a release only counts as done when the new version is actually up.
// Usage: node scripts/wait-healthy.mjs <url> [timeoutSeconds]
const [url, timeoutArg] = process.argv.slice(2);
if (!url) {
  console.error('Usage: node scripts/wait-healthy.mjs <url> [timeoutSeconds]');
  process.exit(2);
}
const deadline = Date.now() + Number(timeoutArg ?? 300) * 1000;

for (let attempt = 1; ; attempt++) {
  let status = 'no answer';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    status = String(res.status);
    if (res.ok) {
      console.log(`Healthy after ${attempt} attempt(s): ${url} → ${status}`);
      process.exit(0);
    }
  } catch (err) {
    status = err instanceof Error ? err.message : String(err);
  }
  if (Date.now() > deadline) {
    console.error(`Not healthy in time: ${url} → ${status}. Check the app's Log stream.`);
    process.exit(1);
  }
  console.log(`Attempt ${attempt}: ${status}, retrying in 10 s…`);
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

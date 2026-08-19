import { runDocValidationJobs } from "./runDocValidationJobs";

const POLL_INTERVAL_MS = 5000;

export function startWorker(): void {
  setInterval(() => {
    runDocValidationJobs().catch((e) => {
      console.error("Worker error:", e);
    });
  }, POLL_INTERVAL_MS);
}

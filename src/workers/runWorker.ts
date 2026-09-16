import { runDocValidationJobs } from "./runDocValidationJobs";
import { runIntegrationJobs } from "./runIntegrationJobs";

const POLL_INTERVAL_MS = 5000;

export function startWorker(): void {
  setInterval(() => {
    runDocValidationJobs().catch((e) => {
      console.error("Worker error:", e);
    });
  }, POLL_INTERVAL_MS);

  setInterval(() => {
    runIntegrationJobs().catch((e) => {
      console.error("Integration worker error:", e);
    });
  }, POLL_INTERVAL_MS);
}

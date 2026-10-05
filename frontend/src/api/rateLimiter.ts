// Client-side rate-limit guard. Reads X-RateLimit-* from every response and
// parks requests when the budget is spent or a 429 arrives (Retry-After).
// Keeps us from hammering the panel into a temporary lock.

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}

class RateLimiter {
  private remaining = Infinity;
  private blockedUntilMs = 0;

  // Called before each request; waits out any active block.
  async acquire(): Promise<void> {
    const now = Date.now();
    if (now < this.blockedUntilMs) {
      await sleep(this.blockedUntilMs - now);
    }
    // If the window is almost empty, add a tiny spacer to avoid the edge.
    if (this.remaining <= 1) {
      await sleep(400);
    }
  }

  // Called after each response to track the budget.
  update(headers: Headers): void {
    const rem = headers.get("X-RateLimit-Remaining");
    if (rem != null) {
      const n = Number(rem);
      if (!Number.isNaN(n)) this.remaining = n;
    }
  }

  // Called on a 429 (or 409 retry) to park until Retry-After.
  block(retryAfterSeconds: number): void {
    const sec = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds : 5;
    this.blockedUntilMs = Date.now() + sec * 1000;
    this.remaining = 0;
  }

  get budgetRemaining(): number {
    return this.remaining;
  }
}

export const rateLimiter = new RateLimiter();

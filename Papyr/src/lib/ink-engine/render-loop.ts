export class RenderLoop {
  private animationFrameId: number | null = null;
  private isRunning = false;
  private callbacks: (() => void)[] = [];

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleFrame();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  addCallback(callback: () => void) {
    this.callbacks.push(callback);
  }

  clearCallbacks() {
    this.callbacks = [];
  }

  private scheduleFrame() {
    this.animationFrameId = requestAnimationFrame(() => {
      if (!this.isRunning) return;

      for (const callback of this.callbacks) {
        callback();
      }

      this.scheduleFrame();
    });
  }
}

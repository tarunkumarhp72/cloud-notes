export type NetworkListener = (isOnline: boolean) => void;

/**
 * NetworkMonitor tracks online/offline connectivity status
 * and notifies subscribers on network transitions.
 */
export class NetworkMonitor {
  private isOnlineState: boolean;
  private listeners = new Set<NetworkListener>();

  constructor(initialOnline?: boolean) {
    if (initialOnline !== undefined) {
      this.isOnlineState = initialOnline;
    } else {
      this.isOnlineState = typeof navigator !== "undefined" ? navigator.onLine : true;
    }
    this.setupListeners();
  }

  private setupListeners(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.setOnline(true);
      });
      window.addEventListener("offline", () => {
        this.setOnline(false);
      });
    }
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public setOnline(online: boolean): void {
    if (this.isOnlineState !== online) {
      this.isOnlineState = online;
      for (const listener of this.listeners) {
        try {
          listener(online);
        } catch (err) {
          console.error("Error in network status listener:", err);
        }
      }
    }
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnlineState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();

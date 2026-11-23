export type BroadcastEvent =
  | { type: "NOTE_UPDATED"; payload: { noteId: string; content: string; title?: string } }
  | { type: "TAB_CREATED"; payload: { noteId: string; title: string; content: string; isMarkdown: boolean } }
  | { type: "TAB_CLOSED"; payload: { noteId: string } }
  | { type: "VAULT_STATUS_CHANGED"; payload: { isLocked: boolean } };

export interface BroadcastEnvelope {
  senderId: string;
  event: BroadcastEvent;
  timestamp: number;
}

export type BroadcastHandler = (event: BroadcastEvent) => void;

/**
 * TabBroadcastSync coordinates active tabs and note edits across multiple
 * browser windows or browser tabs using the HTML5 BroadcastChannel API.
 * Gracefully degrades with no-op operations if BroadcastChannel is unsupported.
 */
export class TabBroadcastSync {
  private channel: BroadcastChannel | null = null;
  private readonly senderId: string;
  private readonly listeners = new Set<BroadcastHandler>();

  constructor(
    channelName = "notepad_cloud_tabs_channel",
    senderId?: string,
    channelOverride?: BroadcastChannel | null
  ) {
    this.senderId = senderId || `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (channelOverride !== undefined) {
      this.channel = channelOverride;
    } else if (typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(channelName);
      } catch {
        this.channel = null;
      }
    }

    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<BroadcastEnvelope>) => {
        const data = event.data;
        if (!data || data.senderId === this.senderId) {
          return;
        }
        for (const listener of this.listeners) {
          try {
            listener(data.event);
          } catch (err) {
            console.error("Error in broadcast listener:", err);
          }
        }
      };
    }
  }

  public getSenderId(): string {
    return this.senderId;
  }

  public isSupported(): boolean {
    return this.channel !== null;
  }

  public broadcast(event: BroadcastEvent): void {
    if (!this.channel) return;
    try {
      const envelope: BroadcastEnvelope = {
        senderId: this.senderId,
        event,
        timestamp: Date.now(),
      };
      this.channel.postMessage(envelope);
    } catch (err) {
      console.warn("Failed to post broadcast message:", err);
    }
  }

  public subscribe(handler: BroadcastHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public destroy(): void {
    this.listeners.clear();
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // ignore close error
      }
      this.channel = null;
    }
  }
}

interface WakeLockSentinel {
  released: boolean;
  type: 'screen';
  release(): Promise<void>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface Navigator {
  wakeLock: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

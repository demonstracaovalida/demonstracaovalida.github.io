import { Injectable, signal, type Signal, type WritableSignal } from '@angular/core';
import { DEMO_INITIAL_DATA } from './demo-data';
import type { DemoSessionState } from './demo-data.models';

function createInitialSessionState(): DemoSessionState {
  return {
    data: structuredClone(DEMO_INITIAL_DATA),
    selectedReceiptIds: [],
    selectedStatementLineIds: [],
  };
}

@Injectable({ providedIn: 'root' })
export class DemoStateService {
  private readonly writableState: WritableSignal<DemoSessionState> = signal(createInitialSessionState());
  readonly state: Signal<DemoSessionState> = this.writableState.asReadonly();

  /** Apply a new in-memory snapshot; callers should return a replacement state. */
  update(reducer: (current: DemoSessionState) => DemoSessionState): void {
    this.writableState.update(reducer);
  }

  /** Restores this tab's private copy and clears any in-memory selections. */
  reset(): void {
    this.writableState.set(createInitialSessionState());
  }
}

import { DestroyRef, Injectable, inject } from '@angular/core';
import type { ConciliationRecord } from './demo-data.models';
import { DemoStateService } from './demo-state.service';

type ReportMessage =
  | { readonly kind: 'valida-report-state-request' }
  | { readonly kind: 'valida-report-state'; readonly conciliations: readonly ConciliationRecord[] };

/** Copies the current simulation once when a report opens in another tab. */
@Injectable({ providedIn: 'root' })
export class ReportWindowHandoffService {
  private readonly demoState = inject(DemoStateService);
  private readonly pendingReports = new Map<Window, readonly ConciliationRecord[]>();
  private receivedSnapshot = false;

  constructor() {
    window.addEventListener('message', this.onMessage);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('message', this.onMessage));
  }

  openReport(url: string): Window | null {
    const reportWindow = window.open(url, '_blank');
    if (reportWindow) {
      this.pendingReports.set(reportWindow, structuredClone(this.demoState.state().data.conciliations));
    }
    return reportWindow;
  }

  requestSnapshotFromOpener(): void {
    if (window.opener) {
      window.opener.postMessage(
        { kind: 'valida-report-state-request' } satisfies ReportMessage,
        window.location.origin,
      );
    }
  }

  private readonly onMessage = (event: MessageEvent<ReportMessage>): void => {
    if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') {
      return;
    }

    if (event.data.kind === 'valida-report-state-request') {
      const reportWindow = event.source as Window | null;
      const snapshot = reportWindow && this.pendingReports.get(reportWindow);
      if (!reportWindow || !snapshot) return;
      this.pendingReports.delete(reportWindow);
      reportWindow.postMessage(
        { kind: 'valida-report-state', conciliations: snapshot } satisfies ReportMessage,
        event.origin,
      );
      return;
    }

    if (
      event.data.kind === 'valida-report-state' &&
      event.source === window.opener &&
      !this.receivedSnapshot &&
      Array.isArray(event.data.conciliations)
    ) {
      this.demoState.applyConciliationSnapshot(event.data.conciliations);
      this.receivedSnapshot = true;
    }
  };
}

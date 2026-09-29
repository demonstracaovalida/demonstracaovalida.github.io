import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { groupReconciliationEntries } from './demo-calculations';
import { DemoStateService } from './demo-state.service';
import { ReportWindowHandoffService } from './report-window-handoff.service';

function reconcileOnePayment(store: DemoStateService): void {
  const accountId = store.state().data.bankAccounts[0].id;
  const date = store.state().data.statementLines[0].transactionDate;
  const payment = groupReconciliationEntries(store.state().data, accountId, date)[0];
  store.selectBankAccount(accountId);
  store.selectStatementDate(date);
  store.toggleReceiptGroupSelection(payment.receiptIds);
  for (const adjustmentId of payment.adjustmentIds) store.toggleAdjustmentSelection(adjustmentId);
  store.toggleStatementGroupSelection(payment.statementLineIds);
  store.reconcileSelected();
}

describe('ReportWindowHandoffService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends the opening snapshot only once to its own report window', () => {
    const store = TestBed.inject(DemoStateService);
    reconcileOnePayment(store);
    const reportWindow = { postMessage: vi.fn() } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(reportWindow);
    const handoff = TestBed.inject(ReportWindowHandoffService);
    handoff.openReport('/resultado-mensal?startDate=2026-08-01');

    const request = () => new MessageEvent('message', {
      data: { kind: 'valida-report-state-request' },
      origin: window.location.origin,
      source: reportWindow,
    });
    window.dispatchEvent(new MessageEvent('message', {
      data: { kind: 'valida-report-state-request' },
      origin: 'https://outro-dominio.example',
      source: reportWindow,
    }));
    expect(reportWindow.postMessage).not.toHaveBeenCalled();

    window.dispatchEvent(request());
    expect(reportWindow.postMessage).toHaveBeenCalledWith({
      kind: 'valida-report-state',
      conciliations: store.state().data.conciliations,
    }, window.location.origin);
    window.dispatchEvent(request());
    expect(reportWindow.postMessage).toHaveBeenCalledTimes(1);
  });

  it('imports an opener snapshot once into the report tab and keeps later changes independent', () => {
    const sourceTab = new DemoStateService();
    reconcileOnePayment(sourceTab);
    const reportTab = TestBed.inject(DemoStateService);
    const opener = { postMessage: vi.fn() } as unknown as Window;
    const previousOpener = window.opener;
    Object.defineProperty(window, 'opener', { configurable: true, value: opener });

    try {
      const handoff = TestBed.inject(ReportWindowHandoffService);
      handoff.requestSnapshotFromOpener();
      expect(opener.postMessage).toHaveBeenCalledWith(
        { kind: 'valida-report-state-request' }, window.location.origin,
      );

      const response = new MessageEvent('message', {
        data: { kind: 'valida-report-state', conciliations: sourceTab.state().data.conciliations },
        origin: window.location.origin,
        source: opener,
      });
      window.dispatchEvent(response);
      expect(reportTab.state().data.conciliations).toHaveLength(1);
      sourceTab.reset();
      expect(reportTab.state().data.conciliations).toHaveLength(1);

      window.dispatchEvent(response);
      expect(reportTab.state().data.conciliations).toHaveLength(1);
      reportTab.reset();
      expect(reportTab.state().data.conciliations).toHaveLength(0);
    } finally {
      Object.defineProperty(window, 'opener', { configurable: true, value: previousOpener });
    }
  });
});

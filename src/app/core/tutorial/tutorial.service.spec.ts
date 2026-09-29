import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { groupReconciliationEntries } from '../demo-data/demo-calculations';
import { DemoStateService } from '../demo-data/demo-state.service';
import { TutorialService } from './tutorial.service';

describe('TutorialService', () => {
  const originalUrl = window.location.href;

  afterEach(() => {
    window.history.replaceState(null, '', originalUrl);
    vi.restoreAllMocks();
  });

  it('requires Sales first and accepts the preset full-month dates', () => {
    const tutorial = TestBed.inject(TutorialService);
    const state = TestBed.inject(DemoStateService);
    const initialData = state.state().data;

    tutorial.startHome();
    expect(tutorial.step()?.id).toBe('home-cards');
    tutorial.next();
    tutorial.next();
    expect(tutorial.step()?.id).toBe('home-report-type');
    expect(tutorial.isReportOptionAvailable('sales')).toBe(true);
    expect(tutorial.isReportOptionAvailable('fees')).toBe(false);
    expect(tutorial.isReportOptionAvailable('monthly')).toBe(false);
    tutorial.next();
    tutorial.observe('home-report-type', '');
    expect(tutorial.step()?.id).toBe('home-report-type');
    tutorial.observe('home-report-type', 'fees');
    expect(tutorial.step()?.id).toBe('home-report-type');
    tutorial.observe('home-report-type', 'monthly');
    expect(tutorial.step()?.id).toBe('home-report-type');

    tutorial.observe('home-report-type', 'sales');
    tutorial.next();
    expect(tutorial.step()?.id).toBe('home-dates');
    tutorial.next();
    expect(tutorial.step()?.id).toBe('home-generate');
    tutorial.next();
    expect(tutorial.step()?.id).toBe('home-generate');
    tutorial.observe('home-generate');
    expect(tutorial.step()?.id).toBe('report-wait');

    tutorial.stop();
    expect(tutorial.step()).toBeNull();
    expect(tutorial.contactPromptVisible()).toBe(false);
    expect(state.state().data).toBe(initialData);
  });

  it('starts the chosen report tutorial and returns control to the main tab', () => {
    window.history.replaceState(null, '', '/relatorio-taxas?tutorial=report');
    const previousOpener = window.opener;
    const opener = { postMessage: vi.fn(), focus: vi.fn() } as unknown as Window;
    Object.defineProperty(window, 'opener', { configurable: true, value: opener });
    try {
      const tutorial = TestBed.inject(TutorialService);
      expect(tutorial.step()?.id).toBe('fees-overview');
      tutorial.next();
      tutorial.next();
      expect(tutorial.step()?.id).toBe('fees-ticket');
      expect(tutorial.step()?.text).toContain('6,25%');
      expect(tutorial.step()?.text).toContain('3,60%');
      tutorial.next();
      expect(tutorial.step()?.id).toBe('report-return');
      tutorial.next();
      expect(tutorial.step()).toBeNull();
      expect(opener.postMessage).toHaveBeenCalledWith(
        { kind: 'valida-tutorial-report-finished' }, window.location.origin,
      );
      expect(opener.focus).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'opener', { configurable: true, value: previousOpener });
    }
  });

  it('skips the Ticket callout if the selected filters hide its row', () => {
    window.history.replaceState(null, '', '/relatorio-taxas?tutorial=report&brand=Visa%20Electron');
    const tutorial = TestBed.inject(TutorialService);
    tutorial.next();
    tutorial.next();
    expect(tutorial.step()?.id).toBe('fees-ticket');
    tutorial.skipMissingTarget('fees-ticket');
    expect(tutorial.step()?.id).toBe('report-return');
  });

  it('propagates explicit cancellation to the report tab in memory', () => {
    const tutorial = TestBed.inject(TutorialService);
    const reportWindow = { postMessage: vi.fn() } as unknown as Window;
    tutorial.startHome();
    tutorial.registerReportWindow(reportWindow, 'sales');
    tutorial.stop();
    expect(reportWindow.postMessage).toHaveBeenCalledWith(
      { kind: 'valida-tutorial-cancel' }, window.location.origin,
    );
  });

  it('visits all three real reports before continuing to Filiais', () => {
    const tutorial = TestBed.inject(TutorialService);
    const reportWindow = () => ({ postMessage: vi.fn() }) as unknown as Window;
    const finishReport = (openedWindow: Window) => window.dispatchEvent(new MessageEvent('message', {
      data: { kind: 'valida-tutorial-report-finished' },
      origin: window.location.origin,
      source: openedWindow,
    }));

    tutorial.startHome();
    tutorial.next();
    tutorial.next();
    tutorial.observe('home-report-type', 'sales');
    tutorial.next();
    expect(tutorial.step()?.id).toBe('home-dates');
    tutorial.next();
    const salesWindow = reportWindow();
    tutorial.registerReportWindow(salesWindow, 'sales');
    tutorial.observe('home-generate');
    expect(tutorial.step()?.id).toBe('report-wait');

    finishReport(salesWindow);
    expect(tutorial.step()?.id).toBe('home-select-fees');
    expect(tutorial.isReportOptionAvailable('sales')).toBe(false);
    expect(tutorial.isReportOptionAvailable('fees')).toBe(true);
    expect(tutorial.isReportOptionAvailable('monthly')).toBe(false);
    tutorial.observe('home-report-type', 'monthly');
    expect(tutorial.step()?.id).toBe('home-select-fees');
    tutorial.observe('home-report-type', 'fees');
    expect(tutorial.step()?.id).toBe('home-full-month-fees');
    expect(tutorial.step()?.text).toContain('01/08/2026');
    expect(tutorial.step()?.text).toContain('31/08/2026');
    expect(tutorial.step()?.text).toContain('Ticket');
    tutorial.next();
    expect(tutorial.step()?.id).toBe('home-generate-fees');
    const feesWindow = reportWindow();
    tutorial.registerReportWindow(feesWindow, 'fees');
    tutorial.observe('home-generate');
    finishReport(feesWindow);
    expect(tutorial.step()?.id).toBe('home-select-monthly');
    expect(tutorial.isReportOptionAvailable('sales')).toBe(false);
    expect(tutorial.isReportOptionAvailable('fees')).toBe(false);
    expect(tutorial.isReportOptionAvailable('monthly')).toBe(true);

    tutorial.observe('home-report-type', 'monthly');
    expect(tutorial.step()?.id).toBe('home-full-month-monthly');
    expect(tutorial.step()?.text).toContain('01/08/2026');
    expect(tutorial.step()?.text).toContain('31/08/2026');
    tutorial.next();
    const monthlyWindow = reportWindow();
    tutorial.registerReportWindow(monthlyWindow, 'monthly');
    tutorial.observe('home-generate');
    finishReport(monthlyWindow);
    expect(tutorial.step()?.id).toBe('branches-navigation');

    window.dispatchEvent(new MessageEvent('message', {
      data: { kind: 'valida-tutorial-cancel' },
      origin: window.location.origin,
      source: monthlyWindow,
    }));
    expect(tutorial.step()?.id).toBe('branches-navigation');
    tutorial.stop();
    expect(tutorial.step()).toBeNull();
    expect(tutorial.isReportOptionAvailable('sales')).toBe(true);
    expect(tutorial.isReportOptionAvailable('fees')).toBe(true);
    expect(tutorial.isReportOptionAvailable('monthly')).toBe(true);
  });

  it('guides the 02/08 manual reconciliation through its negative adjustment', () => {
    const tutorial = TestBed.inject(TutorialService);
    const store = TestBed.inject(DemoStateService);
    const accountId = store.state().data.bankAccounts[0].id;
    store.selectBankAccount(accountId);
    store.selectStatementDate('2026-08-02');
    const group = groupReconciliationEntries(store.state().data, accountId, '2026-08-02')
      .find((item) => item.brand === 'Visa Electron')!;

    tutorial.setManualStage('matching');
    tutorial.startManual();
    expect(tutorial.step()?.id).toBe('manual-statement');
    while (tutorial.step()?.kind === 'informativa') tutorial.next();
    expect(tutorial.step()?.id).toBe('manual-select-statement');

    store.toggleStatementGroupSelection(group.statementLineIds);
    tutorial.observe('manual-statement-selection');
    store.toggleReceiptGroupSelection(group.receiptIds);
    tutorial.observe('manual-receipt-selection');
    expect(tutorial.step()?.id).toBe('manual-select-adjustment');

    store.toggleAdjustmentSelection(group.adjustmentIds[0]);
    tutorial.observe('manual-adjustment-selection');
    expect(tutorial.step()?.id).toBe('manual-reconcile');

    tutorial.observe('manual-reconciled');
    expect(tutorial.step()?.id).toBe('manual-complete');
    tutorial.next();
    expect(tutorial.step()).toBeNull();
    expect(tutorial.contactPromptVisible()).toBe(true);
    tutorial.dismissContactPrompt();
    expect(tutorial.contactPromptVisible()).toBe(false);
  });

  it('offers contact after an early exit without changing the simulation', () => {
    const tutorial = TestBed.inject(TutorialService);
    const state = TestBed.inject(DemoStateService);
    const initialData = state.state().data;

    tutorial.startHome();
    tutorial.finish();
    expect(tutorial.step()).toBeNull();
    expect(tutorial.contactPromptVisible()).toBe(true);
    expect(state.state().data).toBe(initialData);

    tutorial.startHome();
    expect(tutorial.contactPromptVisible()).toBe(false);
    expect(tutorial.step()?.id).toBe('home-cards');
  });

  it('advances the date selection only for 02/08', () => {
    const tutorial = TestBed.inject(TutorialService);
    tutorial.setManualStage('days');
    tutorial.startManual();
    expect(tutorial.step()?.id).toBe('manual-days');
    tutorial.next();
    expect(tutorial.step()?.id).toBe('manual-select-day');
    expect(tutorial.step()?.targets).toEqual(['manual-day-0208']);
    expect(tutorial.step()?.text).toBe('Clique na data 02/08 para abrir a grade de conciliação.');

    tutorial.observe('manual-day', '2026-08-03');
    expect(tutorial.step()?.id).toBe('manual-select-day');
    tutorial.observe('manual-day', '2026-08-02');
    expect(tutorial.step()?.id).toBe('manual-statement');
  });

});

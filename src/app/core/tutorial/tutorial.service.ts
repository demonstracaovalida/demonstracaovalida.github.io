import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { ReportType } from '../demo-data/demo-data.models';
import { DemoStateService } from '../demo-data/demo-state.service';
import { TUTORIAL_MANUAL_DATE, TUTORIAL_STEPS } from './tutorial-steps';

const REPORT_ORDER: readonly ReportType[] = ['sales', 'fees', 'monthly'];
const REPORT_SELECTION_STEPS: Record<ReportType, string> = {
  sales: 'home-select-sales',
  fees: 'home-select-fees',
  monthly: 'home-select-monthly',
};

export type ManualTutorialStage = 'intro' | 'banks' | 'days' | 'matching';

const MANUAL_ENTRY_STEPS: Record<ManualTutorialStage, string> = {
  intro: 'manual-intro',
  banks: 'manual-banks',
  days: 'manual-days',
  matching: 'manual-statement',
};

@Injectable({ providedIn: 'root' })
export class TutorialService {
  private readonly router = inject(Router, { optional: true });
  private readonly demoState = inject(DemoStateService);
  private readonly stepId = signal<string | null>(this.reportEntryStep());
  private readonly visitedReports = new Set<ReportType>();
  private reportWindow: Window | null = null;
  private currentReportType: ReportType | null = null;
  private manualStage: ManualTutorialStage = 'intro';

  readonly step = computed(() => {
    const id = this.stepId();
    return id ? { id, ...TUTORIAL_STEPS[id] } : null;
  });

  constructor() {
    this.router?.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.onNavigation(event.urlAfterRedirects);
    });
    window.addEventListener('message', this.onMessage);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('message', this.onMessage));
  }

  startHome(): void {
    this.stop();
    this.stepId.set('home-cards');
  }

  setManualStage(stage: ManualTutorialStage): void {
    this.manualStage = stage;
  }

  startManual(): void {
    this.stop();
    this.stepId.set(MANUAL_ENTRY_STEPS[this.manualStage]);
  }

  stop(propagate = true): void {
    this.stepId.set(null);
    if (propagate) {
      const otherWindow = this.reportWindow ?? window.opener;
      otherWindow?.postMessage({ kind: 'valida-tutorial-cancel' }, window.location.origin);
    }
    this.reportWindow = null;
    this.currentReportType = null;
    this.visitedReports.clear();
  }

  isReportOptionAvailable(reportType: ReportType): boolean {
    if (!this.stepId()) return true;
    const nextReport = REPORT_ORDER.find((candidate) => !this.visitedReports.has(candidate));
    return !nextReport || nextReport === reportType;
  }

  registerReportWindow(reportWindow: Window | null, reportType: ReportType): void {
    this.reportWindow = reportWindow;
    this.currentReportType = reportWindow ? reportType : null;
  }

  isAwaitingReport(): boolean {
    return ['home-generate', 'home-generate-sales', 'home-generate-full-month'].includes(this.stepId() ?? '');
  }

  next(): void {
    const step = this.step();
    if (!step || step.kind !== 'informativa') return;
    if (step.id === 'report-return') {
      this.stop(false);
      window.opener?.postMessage({ kind: 'valida-tutorial-report-finished' }, window.location.origin);
      window.opener?.focus();
      return;
    }
    this.stepId.set(step.next ?? null);
  }

  observe(action: string, value?: string): void {
    const step = this.step();
    if (!step || step.kind !== 'interativa') return;

    if (action !== step.action) return;
    if (action === 'home-report-type' &&
        (!value || !REPORT_ORDER.includes(value as ReportType) ||
          !this.isReportOptionAvailable(value as ReportType))) return;
    if (step.id === 'home-select-sales' && value !== 'sales') return;
    if (step.id === 'home-select-fees' && value !== 'fees') return;
    if (step.id === 'home-select-monthly' && value !== 'monthly') return;
    if (step.id === 'manual-select-day' && value !== TUTORIAL_MANUAL_DATE) return;
    if (action === 'manual-statement-selection' &&
      this.demoState.state().selectedStatementLineIds.length === 0) return;
    if (action === 'manual-receipt-selection' &&
      this.demoState.state().selectedReceiptIds.length === 0) return;
    if (action === 'manual-adjustment-selection' &&
      this.demoState.state().selectedAdjustmentIds.length === 0) return;
    if (step.id === 'manual-select-receipt') {
      const session = this.demoState.state();
      const adjustmentNeeded = session.data.statementLines.some((line) =>
        session.selectedStatementLineIds.includes(line.id) &&
        line.adjustmentId && !session.selectedAdjustmentIds.includes(line.adjustmentId));
      if (adjustmentNeeded) {
        this.stepId.set('manual-select-adjustment');
        return;
      }
    }
    this.stepId.set(step.next ?? null);
  }

  skipMissingTarget(id: string): void {
    const step = this.step();
    if (step?.id === id && step.optionalWhenMissing) this.stepId.set(step.next ?? null);
  }

  private onNavigation(url: string): void {
    const step = this.step();
    if (step?.kind === 'navegacao' && url.split('?')[0] === step.destination) {
      this.stepId.set(step.next ?? null);
    }
  }

  private readonly onMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin ||
        (event.source !== window.opener && event.source !== this.reportWindow)) return;
    if (event.data?.kind === 'valida-tutorial-cancel') {
      this.stop(false);
    } else if (event.data?.kind === 'valida-tutorial-report-finished' &&
        event.source === this.reportWindow && this.stepId() === 'report-wait') {
      if (this.currentReportType) this.visitedReports.add(this.currentReportType);
      this.reportWindow = null;
      this.currentReportType = null;
      const nextReport = REPORT_ORDER.find((reportType) => !this.visitedReports.has(reportType));
      this.stepId.set(nextReport ? REPORT_SELECTION_STEPS[nextReport] : 'branches-navigation');
    }
  };

  private reportEntryStep(): string | null {
    const browserUrl = new URL(window.location.href);
    const url = browserUrl.hash.startsWith('#/')
      ? new URL(browserUrl.hash.slice(1), browserUrl.origin)
      : browserUrl;
    if (url.searchParams.get('tutorial') !== 'report') return null;
    return ({
      '/relatorio-vendas': 'sales-overview',
      '/relatorio-taxas': 'fees-overview',
      '/resultado-mensal': 'monthly-overview',
    } as Record<string, string>)[url.pathname] ?? null;
  }
}

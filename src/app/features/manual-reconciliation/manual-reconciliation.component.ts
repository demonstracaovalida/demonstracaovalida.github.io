import { IllustrativeControlDirective } from '../../shared/illustrative-control.directive';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  calculateConciliationSelectionTotals,
  canReconcileSelection,
  groupReconciliationEntries,
} from '../../core/demo-data/demo-calculations';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import type { IsoDate, ReconciliationGroup } from '../../core/demo-data/demo-data.models';
import { TutorialService, type ManualTutorialStage } from '../../core/tutorial/tutorial.service';
import { TUTORIAL_MANUAL_DATE } from '../../core/tutorial/tutorial-steps';

type DayFilter = 'all' | 'pending' | 'in-progress' | 'done';

interface StatementDay {
  readonly date: IsoDate;
  readonly statementCount: number;
  readonly statementReconciledCount: number;
  readonly receiptCount: number;
  readonly receiptReconciledCount: number;
  readonly status: 'Pendente' | 'Conciliando' | 'Conciliado';
}

const MONEY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

@Component({
  selector: 'app-manual-reconciliation',
  imports: [RouterLink, IllustrativeControlDirective],
  templateUrl: './manual-reconciliation.component.html',
  styleUrl: './manual-reconciliation.component.css',
})
export class ManualReconciliationComponent {
  private readonly demoState = inject(DemoStateService);
  private readonly tutorial = inject(TutorialService);
  private readonly destroyRef = inject(DestroyRef);
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  private successToastSequence = 0;

  protected readonly stage = signal<ManualTutorialStage>('intro');
  protected readonly dayFilter = signal<DayFilter>('all');
  protected readonly effectiveDayFilter = computed<DayFilter>(() => {
    const stepId = this.tutorial.step()?.id;
    return stepId === 'manual-days' || stepId === 'manual-select-day'
      ? 'all' : this.dayFilter();
  });
  protected readonly historySearch = signal('');
  protected readonly successToastIds = signal<readonly number[]>([]);
  protected readonly bankAccounts = computed(() => this.demoState.state().data.bankAccounts);
  protected readonly bankSelectionBlocked = computed(() => this.tutorial.step()?.id === 'manual-banks');
  protected readonly tutorialManualDate = TUTORIAL_MANUAL_DATE;
  protected readonly selectedBankAccountId = computed(
    () => this.demoState.state().selectedBankAccountId,
  );
  protected readonly selectedBank = computed(() =>
    this.bankAccounts().find((account) => account.id === this.selectedBankAccountId()),
  );
  protected readonly selectedDate = computed(() => this.demoState.state().selectedStatementDate);
  protected readonly statementDays = computed(() => {
    const session = this.demoState.state();
    const dates = new Set<IsoDate>();
    for (const line of session.data.statementLines) {
      if (line.accountId === session.selectedBankAccountId) dates.add(line.transactionDate);
    }
    return [...dates]
      .sort((left, right) => right.localeCompare(left))
      .map((date): StatementDay => {
        const pendingGroups = groupReconciliationEntries(session.data, session.selectedBankAccountId!, date);
        const reconciledGroups = groupReconciliationEntries(session.data, session.selectedBankAccountId!, date, 'Conciliado');
        const totalGroups = pendingGroups.length + reconciledGroups.length;
        return {
          date,
          statementCount: totalGroups,
          statementReconciledCount: reconciledGroups.length,
          receiptCount: totalGroups,
          receiptReconciledCount: reconciledGroups.length,
          status: pendingGroups.length === 0 ? 'Conciliado' : 'Conciliando',
        };
      });
  });
  protected readonly filteredStatementDays = computed(() =>
    this.statementDays().filter((day) => {
      const filter = this.effectiveDayFilter();
      return filter === 'all' ||
        (filter === 'pending' && day.status === 'Pendente') ||
        (filter === 'in-progress' && day.status === 'Conciliando') ||
        (filter === 'done' && day.status === 'Conciliado');
    }),
  );
  protected readonly pendingGroups = computed(() => {
    const session = this.demoState.state();
    if (!session.selectedBankAccountId || !session.selectedStatementDate) return [];
    return groupReconciliationEntries(session.data, session.selectedBankAccountId, session.selectedStatementDate);
  });
  protected readonly pendingAdjustments = computed(() => {
    const session = this.demoState.state();
    if (!session.selectedBankAccountId || !session.selectedStatementDate) return [];
    const availableIds = new Set(session.data.statementLines
      .filter((line) => line.accountId === session.selectedBankAccountId &&
        line.transactionDate === session.selectedStatementDate && line.status === 'Pendente')
      .map((line) => line.adjustmentId));
    return session.data.adjustments.filter((adjustment) =>
      adjustment.status === 'Pendente' && availableIds.has(adjustment.id));
  });
  protected readonly visibleStatementGroups = computed(() => {
    const search = this.historySearch().trim().toLocaleLowerCase('pt-BR');
    return search
      ? this.pendingGroups().filter((group) => group.description.toLocaleLowerCase('pt-BR').includes(search))
      : this.pendingGroups();
  });
  protected readonly selectionTotals = computed(() => {
    const session = this.demoState.state();
    return calculateConciliationSelectionTotals(
      session.selectedReceiptIds,
      session.selectedStatementLineIds,
      session.data.receipts,
      session.data.statementLines,
      session.selectedAdjustmentIds,
      session.data.adjustments,
    );
  });
  protected readonly canReconcile = computed(() => {
    const session = this.demoState.state();
    return canReconcileSelection(
      session.selectedReceiptIds,
      session.selectedStatementLineIds,
      session.data,
      session.selectedAdjustmentIds,
    );
  });
  protected readonly selectedReceiptIds = computed(() => this.demoState.state().selectedReceiptIds);
  protected readonly selectedAdjustmentIds = computed(() => this.demoState.state().selectedAdjustmentIds);
  protected readonly selectedStatementLineIds = computed(() => this.demoState.state().selectedStatementLineIds);
  protected readonly selectedReceiptGroupCount = computed(() =>
    this.pendingGroups().filter((group) => this.isGroupSelected(group.receiptIds, this.selectedReceiptIds())).length,
  );
  protected readonly selectedStatementGroupCount = computed(() =>
    this.pendingGroups().filter((group) => this.isGroupSelected(group.statementLineIds, this.selectedStatementLineIds())).length,
  );

  constructor() {
    this.tutorial.setManualStage(this.stage());
    this.destroyRef.onDestroy(() => this.clearSuccessTimer());
  }

  protected startNewReconciliation(): void {
    this.setStage('banks');
  }

  protected selectBankAccount(accountId: string): void {
    if (this.bankSelectionBlocked()) return;
    this.demoState.selectBankAccount(accountId);
    this.dayFilter.set('all');
    this.setStage('days');
  }

  protected selectDay(date: IsoDate): void {
    if (this.daySelectionBlocked(date)) return;
    this.demoState.selectStatementDate(date);
    this.historySearch.set('');
    this.setStage('matching');
  }

  protected daySelectionBlocked(date: IsoDate): boolean {
    const stepId = this.tutorial.step()?.id;
    return stepId === 'manual-days' ||
      (stepId === 'manual-select-day' && date !== TUTORIAL_MANUAL_DATE);
  }

  protected changeBank(): void {
    this.demoState.clearSelection();
    this.setStage('banks');
  }

  protected changeDate(): void {
    this.demoState.clearSelection();
    this.dayFilter.set('all');
    this.setStage('days');
  }

  protected setDayFilter(filter: DayFilter): void {
    this.dayFilter.set(filter);
  }

  protected setHistorySearch(event: Event): void {
    this.historySearch.set((event.target as HTMLInputElement).value);
  }

  protected toggleReceipt(group: ReconciliationGroup): void {
    this.demoState.toggleReceiptGroupSelection(group.receiptIds);
  }

  protected toggleAdjustment(adjustmentId: string): void {
    this.demoState.toggleAdjustmentSelection(adjustmentId);
  }

  protected toggleStatement(group: ReconciliationGroup): void {
    this.demoState.toggleStatementGroupSelection(group.statementLineIds);
  }

  protected toggleAllReceipts(): void {
    this.demoState.toggleReceiptGroupSelection(this.pendingGroups().flatMap((group) => group.receiptIds));
  }

  protected toggleAllStatements(): void {
    this.demoState.toggleStatementGroupSelection(this.visibleStatementGroups().flatMap((group) => group.statementLineIds));
  }

  protected isGroupSelected(ids: readonly string[], selectedIds: readonly string[]): boolean {
    return ids.length > 0 && ids.every((id) => selectedIds.includes(id));
  }

  protected clearSelection(): void {
    this.demoState.clearSelection();
  }

  protected reconcileSelected(): void {
    if (!this.canReconcile()) return;
    this.demoState.reconcileSelected();
    this.tutorial.observe('manual-reconciled');
    this.clearSuccessTimer();
    this.successToastIds.set([++this.successToastSequence]);
    this.successTimer = setTimeout(() => this.successToastIds.set([]), 5000);
  }

  protected resetSimulation(): void {
    this.clearSuccessTimer();
    this.successToastIds.set([]);
    this.demoState.reset();
    this.dayFilter.set('all');
    this.historySearch.set('');
    this.setStage('intro');
  }

  private setStage(stage: ManualTutorialStage): void {
    this.stage.set(stage);
    this.tutorial.setManualStage(stage);
  }

  protected formatMoney(amountCents: number): string {
    const sign = amountCents < 0 ? '-' : '';
    return `${sign}R$ ${MONEY_FORMATTER.format(Math.abs(amountCents) / 100)}`;
  }

  protected bankDisplayName(): string {
    return this.selectedBank()?.bankName.replace(/\s*\(\d+\)$/, '') ?? '';
  }

  private clearSuccessTimer(): void {
    if (this.successTimer !== null) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
  }

  protected formatDate(date: IsoDate): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
}

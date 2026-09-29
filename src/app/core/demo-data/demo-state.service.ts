import { Injectable, signal, type Signal, type WritableSignal } from '@angular/core';
import { calculateConciliationSelectionTotals, canReconcileSelection } from './demo-calculations';
import { DEMO_INITIAL_DATA } from './demo-data';
import type { ConciliationRecord, DemoSessionState, IsoDate } from './demo-data.models';

function createInitialSessionState(): DemoSessionState {
  return {
    data: structuredClone(DEMO_INITIAL_DATA),
    selectedBankAccountId: null,
    selectedStatementDate: null,
    selectedReceiptIds: [],
    selectedAdjustmentIds: [],
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

  selectBankAccount(accountId: string): void {
    this.writableState.update((current) => {
      if (!current.data.bankAccounts.some((account) => account.id === accountId)) {
        throw new Error(`Conta bancária desconhecida: ${accountId}.`);
      }
      return {
        ...current,
        selectedBankAccountId: accountId,
        selectedStatementDate: null,
        selectedReceiptIds: [],
        selectedAdjustmentIds: [],
        selectedStatementLineIds: [],
      };
    });
  }

  selectStatementDate(date: IsoDate): void {
    this.writableState.update((current) => {
      if (
        !current.selectedBankAccountId ||
        !current.data.statementLines.some(
          (line) => line.accountId === current.selectedBankAccountId && line.transactionDate === date,
        )
      ) {
        throw new Error(`Extrato indisponível para a data ${date}.`);
      }
      return {
        ...current,
        selectedStatementDate: date,
        selectedReceiptIds: [],
        selectedAdjustmentIds: [],
        selectedStatementLineIds: [],
      };
    });
  }

  toggleReceiptSelection(receiptId: string): void {
    this.toggleReceiptGroupSelection([receiptId]);
  }

  toggleReceiptGroupSelection(receiptIds: readonly string[]): void {
    this.writableState.update((current) => {
      if (receiptIds.length === 0) return current;
      const uniqueIds = new Set(receiptIds);
      if (uniqueIds.size !== receiptIds.length) throw new Error('Recebimentos repetidos na seleção.');
      for (const receiptId of receiptIds) {
        const matchingLine = current.data.statementLines.find(
          (line) =>
            line.receiptId === receiptId &&
            line.accountId === current.selectedBankAccountId &&
            line.transactionDate === current.selectedStatementDate &&
            line.status === 'Pendente',
        );
        const receipt = current.data.receipts.find((item) => item.id === receiptId);
        if (!matchingLine || !receipt || receipt.status !== 'Pendente') {
          throw new Error(`Recebimento indisponível para seleção: ${receiptId}.`);
        }
      }
      const allSelected = receiptIds.every((id) => current.selectedReceiptIds.includes(id));
      return {
        ...current,
        selectedReceiptIds: allSelected
          ? current.selectedReceiptIds.filter((id) => !uniqueIds.has(id))
          : [...new Set([...current.selectedReceiptIds, ...receiptIds])],
      };
    });
  }

  toggleAdjustmentSelection(adjustmentId: string): void {
    this.writableState.update((current) => {
      const adjustment = current.data.adjustments.find((item) => item.id === adjustmentId);
      const matchingLine = current.data.statementLines.find((line) => line.adjustmentId === adjustmentId);
      if (!adjustment || adjustment.status !== 'Pendente' ||
          !matchingLine || matchingLine.status !== 'Pendente' ||
          matchingLine.accountId !== current.selectedBankAccountId ||
          matchingLine.transactionDate !== current.selectedStatementDate) {
        throw new Error(`Ajuste indisponível para seleção: ${adjustmentId}.`);
      }
      return {
        ...current,
        selectedAdjustmentIds: current.selectedAdjustmentIds.includes(adjustmentId)
          ? current.selectedAdjustmentIds.filter((id) => id !== adjustmentId)
          : [...current.selectedAdjustmentIds, adjustmentId],
      };
    });
  }

  toggleStatementLineSelection(lineId: string): void {
    this.toggleStatementGroupSelection([lineId]);
  }

  toggleStatementGroupSelection(lineIds: readonly string[]): void {
    this.writableState.update((current) => {
      if (lineIds.length === 0) return current;
      const uniqueIds = new Set(lineIds);
      if (uniqueIds.size !== lineIds.length) throw new Error('Lançamentos repetidos na seleção.');
      for (const lineId of lineIds) {
        const line = current.data.statementLines.find((item) => item.id === lineId);
        if (
          !line ||
          line.accountId !== current.selectedBankAccountId ||
          line.transactionDate !== current.selectedStatementDate ||
          line.status !== 'Pendente'
        ) {
          throw new Error(`Lançamento indisponível para seleção: ${lineId}.`);
        }
      }
      const allSelected = lineIds.every((id) => current.selectedStatementLineIds.includes(id));
      return {
        ...current,
        selectedStatementLineIds: allSelected
          ? current.selectedStatementLineIds.filter((id) => !uniqueIds.has(id))
          : [...new Set([...current.selectedStatementLineIds, ...lineIds])],
      };
    });
  }

  clearSelection(): void {
    this.writableState.update((current) => ({
      ...current,
      selectedReceiptIds: [],
      selectedAdjustmentIds: [],
      selectedStatementLineIds: [],
    }));
  }

  reconcileSelected(): void {
    this.writableState.update((current) => {
      if (!canReconcileSelection(
        current.selectedReceiptIds, current.selectedStatementLineIds, current.data,
        current.selectedAdjustmentIds,
      )) {
        throw new Error('Seleção de conciliação inválida.');
      }

      const receiptIds = new Set(current.selectedReceiptIds);
      const adjustmentIds = new Set(current.selectedAdjustmentIds);
      const statementLineIds = new Set(current.selectedStatementLineIds);
      const selectedLines = current.data.statementLines.filter((line) => statementLineIds.has(line.id));
      if (
        !current.selectedBankAccountId ||
        !current.selectedStatementDate ||
        selectedLines.some(
          (line) =>
            line.accountId !== current.selectedBankAccountId ||
            line.transactionDate !== current.selectedStatementDate,
        )
      ) {
        throw new Error('Os lançamentos selecionados não pertencem ao extrato aberto.');
      }

      const amountCents = calculateConciliationSelectionTotals(
        current.selectedReceiptIds,
        current.selectedStatementLineIds,
        current.data.receipts,
        current.data.statementLines,
        current.selectedAdjustmentIds,
        current.data.adjustments,
      ).counterpartAmountCents;

      return {
        ...current,
        data: {
          ...current.data,
          receipts: current.data.receipts.map((receipt) =>
            receiptIds.has(receipt.id) ? { ...receipt, status: 'Conciliado' as const } : receipt,
          ),
          adjustments: current.data.adjustments.map((adjustment) =>
            adjustmentIds.has(adjustment.id) ? { ...adjustment, status: 'Conciliado' as const } : adjustment,
          ),
          statementLines: current.data.statementLines.map((line) =>
            statementLineIds.has(line.id) ? { ...line, status: 'Conciliado' as const } : line,
          ),
          conciliations: [
            ...current.data.conciliations,
            {
              id: `conciliacao-${current.data.conciliations.length + 1}`,
              receiptIds: [...current.selectedReceiptIds],
              ...(adjustmentIds.size ? { adjustmentIds: [...current.selectedAdjustmentIds] } : {}),
              statementLineIds: [...current.selectedStatementLineIds],
              amountCents,
              reconciledAt: new Date().toISOString(),
            },
          ],
        },
        selectedReceiptIds: [],
        selectedAdjustmentIds: [],
        selectedStatementLineIds: [],
      };
    });
  }

  /** Applies a one-time report snapshot to this tab's own initial dataset. */
  applyConciliationSnapshot(records: readonly ConciliationRecord[]): void {
    this.writableState.update((current) => {
      if (current.data.conciliations.length > 0) {
        throw new Error('O estado desta aba já contém conciliações.');
      }

      let data = current.data;
      for (const record of records) {
        if (!canReconcileSelection(record.receiptIds, record.statementLineIds, data, record.adjustmentIds ?? [])) {
          throw new Error(`Conciliação inválida no relatório: ${record.id}.`);
        }
        const receiptIds = new Set(record.receiptIds);
        const adjustmentIds = new Set(record.adjustmentIds ?? []);
        const statementLineIds = new Set(record.statementLineIds);
        const amountCents = calculateConciliationSelectionTotals(
          record.receiptIds,
          record.statementLineIds,
          data.receipts,
          data.statementLines,
          record.adjustmentIds ?? [],
          data.adjustments,
        ).counterpartAmountCents;
        if (amountCents !== record.amountCents) {
          throw new Error(`Valor divergente na conciliação ${record.id}.`);
        }
        data = {
          ...data,
          receipts: data.receipts.map((receipt) =>
            receiptIds.has(receipt.id) ? { ...receipt, status: 'Conciliado' as const } : receipt,
          ),
          adjustments: data.adjustments.map((adjustment) =>
            adjustmentIds.has(adjustment.id) ? { ...adjustment, status: 'Conciliado' as const } : adjustment,
          ),
          statementLines: data.statementLines.map((line) =>
            statementLineIds.has(line.id) ? { ...line, status: 'Conciliado' as const } : line,
          ),
          conciliations: [...data.conciliations, structuredClone(record)],
        };
      }

      return {
        ...current,
        data,
        selectedReceiptIds: [],
        selectedAdjustmentIds: [],
        selectedStatementLineIds: [],
      };
    });
  }

  /** Restores this tab's private copy and clears any in-memory selections. */
  reset(): void {
    this.writableState.set(createInitialSessionState());
  }
}

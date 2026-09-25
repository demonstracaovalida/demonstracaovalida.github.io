import { calculateTotals, groupReconciliationEntries } from './demo-calculations';
import { DemoStateService } from './demo-state.service';

describe('DemoStateService', () => {
  it('keeps independent in-memory state per service instance', () => {
    const firstTab = new DemoStateService();
    const secondTab = new DemoStateService();
    const receipt = firstTab.state().data.receipts[0];
    if (!receipt) {
      throw new Error('A massa deve conter ao menos um recebimento.');
    }

    firstTab.update((current) => ({
      ...current,
      selectedReceiptIds: [receipt.id],
    }));

    expect(firstTab.state().selectedReceiptIds).toEqual([receipt.id]);
    expect(secondTab.state().selectedReceiptIds).toEqual([]);
    expect(firstTab.state().data).not.toBe(secondTab.state().data);
  });

  it('restores the original data and clears selections on reset', () => {
    const store = new DemoStateService();
    const receipt = store.state().data.receipts[0];
    if (!receipt) {
      throw new Error('A massa deve conter ao menos um recebimento.');
    }

    store.update((current) => ({
      ...current,
      selectedBankAccountId: current.data.bankAccounts[0].id,
      selectedReceiptIds: [receipt.id],
      selectedStatementLineIds: ['extrato-usado-na-sessao'],
      data: {
        ...current.data,
        conciliations: [
          {
            id: 'conciliacao-da-sessao',
            receiptIds: [receipt.id],
            statementLineIds: ['extrato-usado-na-sessao'],
            amountCents: receipt.amountCents,
            reconciledAt: '2026-09-24T12:00:00.000Z',
          },
        ],
      },
    }));

    store.reset();

    expect(store.state().data.conciliations).toEqual([]);
    expect(store.state().selectedReceiptIds).toEqual([]);
    expect(store.state().selectedStatementLineIds).toEqual([]);
    expect(store.state().selectedBankAccountId).toBeNull();
    expect(store.state().data.sales).toHaveLength(289);
    expect(store.state().data.receipts).toHaveLength(store.state().data.sales.length);
  });

  it('restricts selection to the open statement and reconciles only matching entries', () => {
    const store = new DemoStateService();
    const account = store.state().data.bankAccounts[0];
    const line = store.state().data.statementLines[0];
    const otherDayLine = store.state().data.statementLines.find(
      (item) => item.transactionDate !== line.transactionDate,
    )!;

    store.selectBankAccount(account.id);
    store.selectStatementDate(line.transactionDate);
    expect(() => store.toggleStatementLineSelection(otherDayLine.id)).toThrow();
    store.toggleReceiptSelection(line.receiptId);
    expect(() => store.reconcileSelected()).toThrow();
    expect(store.state().data.conciliations).toEqual([]);

    store.toggleStatementLineSelection(line.id);
    store.reconcileSelected();
    expect(store.state().data.conciliations[0]).toMatchObject({
      receiptIds: [line.receiptId],
      statementLineIds: [line.id],
      amountCents: line.amountCents,
    });
    expect(store.state().data.receipts.find((receipt) => receipt.id === line.receiptId)?.status).toBe('Conciliado');
    expect(store.state().data.statementLines.find((item) => item.id === line.id)?.status).toBe('Conciliado');
    expect(store.state().selectedReceiptIds).toEqual([]);
    expect(store.state().selectedStatementLineIds).toEqual([]);
    expect(() => store.toggleReceiptSelection(line.receiptId)).toThrow();
  });

  it('copies a reconciled report snapshot once without linking two tabs or surviving reset and reload', () => {
    const sourceTab = new DemoStateService();
    const reportTab = new DemoStateService();
    const accountId = sourceTab.state().data.bankAccounts[0].id;
    const date = sourceTab.state().data.statementLines[0].transactionDate;
    const payment = groupReconciliationEntries(sourceTab.state().data, accountId, date)[0];
    const originalTotals = calculateTotals(sourceTab.state().data);

    sourceTab.selectBankAccount(accountId);
    sourceTab.selectStatementDate(date);
    sourceTab.toggleReceiptGroupSelection(payment.receiptIds);
    sourceTab.toggleStatementGroupSelection(payment.statementLineIds);
    sourceTab.reconcileSelected();

    const snapshot = structuredClone(sourceTab.state().data.conciliations);
    expect(reportTab.state().data.conciliations).toHaveLength(0);
    reportTab.applyConciliationSnapshot(snapshot);
    expect(reportTab.state().data.conciliations).toEqual(snapshot);
    expect(reportTab.state().data.receipts
      .filter((receipt) => payment.receiptIds.includes(receipt.id))
      .every((receipt) => receipt.status === 'Conciliado')).toBe(true);
    expect(reportTab.state().data.statementLines
      .filter((line) => payment.statementLineIds.includes(line.id))
      .every((line) => line.status === 'Conciliado')).toBe(true);
    expect(calculateTotals(reportTab.state().data)).toEqual(originalTotals);

    sourceTab.reset();
    expect(reportTab.state().data.conciliations).toHaveLength(1);
    const freshTab = new DemoStateService();
    expect(freshTab.state().data.conciliations).toHaveLength(0);
    expect(freshTab.state().data.receipts.every((receipt) => receipt.status === 'Pendente')).toBe(true);

    const invalidTab = new DemoStateService();
    expect(() => invalidTab.applyConciliationSnapshot([
      { ...snapshot[0], amountCents: snapshot[0].amountCents + 1 },
    ])).toThrow('Valor divergente');
    expect(invalidTab.state().data.conciliations).toHaveLength(0);

    reportTab.reset();
    expect(reportTab.state().data.conciliations).toHaveLength(0);
    expect(reportTab.state().data.receipts.every((receipt) => receipt.status === 'Pendente')).toBe(true);
  });
});

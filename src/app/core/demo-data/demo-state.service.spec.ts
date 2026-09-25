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
});

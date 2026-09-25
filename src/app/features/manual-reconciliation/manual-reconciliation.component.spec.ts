import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { groupReconciliationEntries } from '../../core/demo-data/demo-calculations';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { ManualReconciliationComponent } from './manual-reconciliation.component';

describe('ManualReconciliationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualReconciliationComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('opens the bank selection only after Nova Conciliação Manual is clicked', () => {
    const fixture = TestBed.createComponent(ManualReconciliationComponent);
    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;

    expect(rendered.querySelector('.introduction')).toBeTruthy();
    expect(rendered.querySelector('.bank-selection')).toBeNull();

    rendered.querySelector<HTMLButtonElement>('.new-manual-button')!.click();
    fixture.detectChanges();

    expect(rendered.querySelector('.introduction')).toBeNull();
    expect(rendered.querySelector('.bank-selection')).toBeTruthy();
    expect(rendered.querySelectorAll('.bank-card')).toHaveLength(
      TestBed.inject(DemoStateService).state().data.bankAccounts.length,
    );
  });

  it('uses the central bank account and retains the selected account in the session', () => {
    const fixture = TestBed.createComponent(ManualReconciliationComponent);
    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;
    rendered.querySelector<HTMLButtonElement>('.new-manual-button')!.click();
    fixture.detectChanges();

    const store = TestBed.inject(DemoStateService);
    const account = store.state().data.bankAccounts[0];
    const card = rendered.querySelector<HTMLButtonElement>('.bank-card')!;
    expect(card.textContent).toContain(account.bankName);
    expect(card.textContent).toContain(account.agency);
    expect(card.textContent).toContain(account.accountNumber);
    expect(store.state().data.statementLines.every((line) => line.accountId === account.id)).toBe(true);

    card.click();
    fixture.detectChanges();
    expect(store.state().selectedBankAccountId).toBe(account.id);
    expect(rendered.querySelector('.days-selection')).toBeTruthy();
    expect(rendered.querySelectorAll('.day-card')).toHaveLength(31);
    expect(rendered.querySelector('.flow-heading')?.textContent).toContain(account.accountNumber);

    store.reset();
    fixture.detectChanges();
    expect(store.state().selectedBankAccountId).toBeNull();
  });

  it('filters statement days and history, then returns to the date selection', () => {
    const fixture = TestBed.createComponent(ManualReconciliationComponent);
    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;
    rendered.querySelector<HTMLButtonElement>('.new-manual-button')!.click();
    fixture.detectChanges();
    rendered.querySelector<HTMLButtonElement>('.bank-card')!.click();
    fixture.detectChanges();

    const filters = rendered.querySelectorAll<HTMLButtonElement>('.day-filters button');
    filters[1].click();
    fixture.detectChanges();
    expect(rendered.querySelectorAll('.day-card')).toHaveLength(0);
    filters[2].click();
    fixture.detectChanges();
    expect(rendered.querySelectorAll('.day-card')).toHaveLength(31);

    rendered.querySelector<HTMLButtonElement>('.day-card')!.click();
    fixture.detectChanges();
    const search = rendered.querySelector<HTMLInputElement>('#history-filter')!;
    search.value = 'Mastercard';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const descriptions = [...rendered.querySelectorAll<HTMLTableCellElement>('.statement-table tbody tr td:nth-child(2)')];
    expect(descriptions.length).toBeGreaterThan(0);
    expect(descriptions.every((cell) => cell.textContent?.includes('Mastercard'))).toBe(true);

    rendered.querySelector<HTMLButtonElement>('.matching-tools button:nth-child(4)')!.click();
    fixture.detectChanges();
    expect(rendered.querySelector('.days-selection')).toBeTruthy();
    expect(TestBed.inject(DemoStateService).state().selectedReceiptIds).toEqual([]);
  });

  it('consolidates both Visa Electron sales on 29/08 into one payment on each side and reconciles the whole group', () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(ManualReconciliationComponent);
      fixture.detectChanges();
      const rendered = fixture.nativeElement as HTMLElement;
      const store = TestBed.inject(DemoStateService);

      rendered.querySelector<HTMLButtonElement>('.new-manual-button')!.click();
      fixture.detectChanges();
      rendered.querySelector<HTMLButtonElement>('.bank-card')!.click();
      fixture.detectChanges();
      expect(rendered.querySelector('.matching-stage')).toBeNull();
      const dayCard = [...rendered.querySelectorAll<HTMLButtonElement>('.day-card')]
        .find((card) => card.textContent?.includes('29/08/2026'))!;
      dayCard.click();
      fixture.detectChanges();

      const session = store.state();
      const group = groupReconciliationEntries(session.data, session.selectedBankAccountId!, '2026-08-29')
        .find((item) => item.brand === 'Visa Electron')!;
      expect(group.receiptIds).toHaveLength(2);
      expect(group.statementLineIds).toHaveLength(2);
      expect(group.installmentCount).toBe(2);
      const expectedAmount = session.data.receipts
        .filter((receipt) => group.receiptIds.includes(receipt.id))
        .reduce((sum, receipt) => sum + receipt.amountCents, 0);
      expect(group.amountCents).toBe(expectedAmount);
      const receiptRows = [...rendered.querySelectorAll<HTMLTableRowElement>('.receipt-table tbody tr')]
        .filter((row) => row.textContent?.includes('Visa Electron'));
      const statementRows = [...rendered.querySelectorAll<HTMLTableRowElement>('.statement-table tbody tr')]
        .filter((row) => row.textContent?.includes('Visa Electron'));
      expect(receiptRows).toHaveLength(1);
      expect(statementRows).toHaveLength(1);
      expect(receiptRows[0].cells[4].textContent?.trim()).toBe('2');
      expect(receiptRows[0].cells[5].textContent?.trim()).toBe(formatMoney(expectedAmount));
      expect(statementRows[0].cells[2].textContent?.trim()).toBe(formatMoney(expectedAmount));

      const action = rendered.querySelector<HTMLButtonElement>('.reconcile-action')!;
      expect(action.disabled).toBe(true);

      receiptRows[0].querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
      fixture.detectChanges();
      expect(store.state().selectedReceiptIds).toEqual(group.receiptIds);
      expect(rendered.querySelector('.matching-totals > div:nth-child(3) strong')?.textContent?.trim()).toBe(
        formatMoney(expectedAmount),
      );
      expect(rendered.querySelector('.receipt-panel .panel-total')?.textContent).toContain('(1 item)');
      expect(action.disabled).toBe(true);

      statementRows[0].querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
      fixture.detectChanges();
      expect(store.state().selectedStatementLineIds).toEqual(group.statementLineIds);
      expect(rendered.querySelector('.matching-totals > div:first-child strong')?.textContent?.trim()).toBe(formatMoney(expectedAmount));
      expect(rendered.querySelector('.matching-totals > div:nth-child(2) strong')?.textContent?.trim()).toBe(formatMoney(expectedAmount));
      expect(action.disabled).toBe(false);
      expect(rendered.querySelector('.statement-panel .panel-total')?.textContent).toContain('(1 item)');
      expect(rendered.querySelector('.matching-totals > div:last-child strong')?.textContent?.trim()).toBe('R$ 0,00 ✓');

      action.click();
      fixture.detectChanges();
      expect(store.state().data.receipts.filter((item) => group.receiptIds.includes(item.id)).every((item) => item.status === 'Conciliado')).toBe(true);
      expect(store.state().data.statementLines.filter((item) => group.statementLineIds.includes(item.id)).every((item) => item.status === 'Conciliado')).toBe(true);
      expect(store.state().data.conciliations).toHaveLength(1);
      expect(store.state().data.conciliations[0].amountCents).toBe(expectedAmount);
      expect(store.state().selectedReceiptIds).toEqual([]);
      expect([...rendered.querySelectorAll<HTMLTableRowElement>('.receipt-table tbody tr')]
        .filter((row) => row.textContent?.includes('Visa Electron'))).toHaveLength(0);
      expect([...rendered.querySelectorAll<HTMLTableRowElement>('.statement-table tbody tr')]
        .filter((row) => row.textContent?.includes('Visa Electron'))).toHaveLength(0);
      expect(rendered.querySelector('[role="status"]')?.textContent).toContain('sucesso');

      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      expect(rendered.querySelector('[role="status"]')).toBeNull();

      rendered.querySelector<HTMLButtonElement>('.reset-button')!.click();
      fixture.detectChanges();
      expect(rendered.querySelector('.introduction')).toBeTruthy();
      expect(store.state().data.conciliations).toEqual([]);
      expect(store.state().data.receipts.filter((item) => group.receiptIds.includes(item.id)).every((item) => item.status === 'Pendente')).toBe(true);
      expect(store.state().selectedStatementDate).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

function formatMoney(amountCents: number): string {
  return `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountCents / 100)}`;
}

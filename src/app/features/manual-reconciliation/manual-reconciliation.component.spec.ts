import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { groupReconciliationEntries } from '../../core/demo-data/demo-calculations';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { TutorialService } from '../../core/tutorial/tutorial.service';
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

  it('waits for the bank selection step before accepting a bank click in the tutorial', () => {
    const fixture = TestBed.createComponent(ManualReconciliationComponent);
    const tutorial = TestBed.inject(TutorialService);
    const store = TestBed.inject(DemoStateService);
    fixture.detectChanges();

    tutorial.startManual();
    tutorial.next();
    const rendered = fixture.nativeElement as HTMLElement;
    rendered.querySelector<HTMLButtonElement>('.new-manual-button')!.click();
    tutorial.observe('manual-start');
    fixture.detectChanges();
    expect(tutorial.step()?.id).toBe('manual-banks');

    const card = rendered.querySelector<HTMLButtonElement>('.bank-card')!;
    expect(card.disabled).toBe(true);
    card.click();
    fixture.detectChanges();
    expect(store.state().selectedBankAccountId).toBeNull();
    expect(rendered.querySelector('.bank-selection')).toBeTruthy();

    tutorial.next();
    fixture.detectChanges();
    expect(tutorial.step()?.id).toBe('manual-select-bank');
    expect(card.disabled).toBe(false);
    expect(card.dataset['tour']).toBe('manual-bank-card');
    card.click();
    fixture.detectChanges();
    expect(store.state().selectedBankAccountId).toBe(store.state().data.bankAccounts[0].id);
    expect(rendered.querySelector('.days-selection')).toBeTruthy();
  });

  it('requires the 02/08 card after the date overview in the tutorial', () => {
    const fixture = TestBed.createComponent(ManualReconciliationComponent);
    const tutorial = TestBed.inject(TutorialService);
    const store = TestBed.inject(DemoStateService);
    fixture.detectChanges();

    tutorial.startManual();
    tutorial.next();
    const rendered = fixture.nativeElement as HTMLElement;
    rendered.querySelector<HTMLButtonElement>('.new-manual-button')!.click();
    tutorial.observe('manual-start');
    tutorial.next();
    fixture.detectChanges();
    rendered.querySelector<HTMLButtonElement>('.bank-card')!.click();
    tutorial.observe('manual-bank');
    fixture.detectChanges();
    expect(tutorial.step()?.id).toBe('manual-days');

    const cards = [...rendered.querySelectorAll<HTMLButtonElement>('.day-card')];
    const target = cards.find((card) => card.textContent?.includes('02/08/2026'))!;
    const other = cards.find((card) => card !== target)!;
    expect(cards.every((card) => card.disabled)).toBe(true);
    other.click();
    fixture.detectChanges();
    expect(store.state().selectedStatementDate).toBeNull();

    tutorial.next();
    fixture.detectChanges();
    expect(tutorial.step()?.id).toBe('manual-select-day');
    expect(target.dataset['tour']).toBe('manual-day-0208');
    expect(target.dataset['tourValue']).toBe('2026-08-02');
    expect(target.disabled).toBe(false);
    expect(other.disabled).toBe(true);
    other.click();
    fixture.detectChanges();
    expect(store.state().selectedStatementDate).toBeNull();

    target.click();
    tutorial.observe('manual-day', target.dataset['tourValue']);
    fixture.detectChanges();
    expect(store.state().selectedStatementDate).toBe('2026-08-02');
    expect(rendered.querySelector('.matching-stage')).toBeTruthy();
    expect(tutorial.step()?.id).toBe('manual-statement');
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
    expect(rendered.querySelector('.day-status')?.textContent).toContain('Conciliando');

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

      rendered.querySelector<HTMLButtonElement>('.matching-tools button:nth-child(4)')!.click();
      fixture.detectChanges();
      const inProgressDay = [...rendered.querySelectorAll<HTMLButtonElement>('.day-card')]
        .find((card) => card.textContent?.includes('29/08/2026'))!;
      expect(inProgressDay.querySelector('.day-status')?.textContent).toContain('Conciliando');
      rendered.querySelectorAll<HTMLButtonElement>('.day-filters button')[2].click();
      fixture.detectChanges();
      expect(rendered.querySelectorAll('.day-card')).toHaveLength(31);
      inProgressDay.click();
      fixture.detectChanges();

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

  it('requires the negative machine rental adjustment to balance Visa Electron on 02/08', () => {
    const fixture = TestBed.createComponent(ManualReconciliationComponent);
    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;
    const store = TestBed.inject(DemoStateService);
    rendered.querySelector<HTMLButtonElement>('.new-manual-button')!.click();
    fixture.detectChanges();
    rendered.querySelector<HTMLButtonElement>('.bank-card')!.click();
    fixture.detectChanges();
    [...rendered.querySelectorAll<HTMLButtonElement>('.day-card')]
      .find((card) => card.textContent?.includes('02/08/2026'))!.click();
    fixture.detectChanges();

    const group = groupReconciliationEntries(
      store.state().data, store.state().selectedBankAccountId!, '2026-08-02',
    ).find((item) => item.brand === 'Visa Electron')!;
    const statementRow = [...rendered.querySelectorAll<HTMLTableRowElement>('.statement-table tbody tr')]
      .find((row) => row.textContent?.includes('Visa Electron'))!;
    const receiptRow = [...rendered.querySelectorAll<HTMLTableRowElement>('.receipt-table tbody tr')]
      .find((row) => row.textContent?.includes('Visa Electron'))!;
    const adjustmentRow = rendered.querySelector<HTMLTableRowElement>('.adjustment-table tbody tr')!;
    const action = rendered.querySelector<HTMLButtonElement>('.reconcile-action')!;

    expect(statementRow.cells[2].textContent?.trim()).toBe(formatMoney(group.amountCents - 5_000));
    expect(receiptRow.cells[5].textContent?.trim()).toBe(formatMoney(group.amountCents));
    expect(adjustmentRow.textContent).toContain('02/08/2026');
    expect(adjustmentRow.textContent).toContain('Aluguel maquininha');
    expect(adjustmentRow.textContent).toContain('Cielo');
    expect(adjustmentRow.textContent).toContain('Visa Electron');
    expect(adjustmentRow.textContent).toContain('-R$ 50,00');

    receiptRow.querySelector<HTMLInputElement>('input')!.click();
    statementRow.querySelector<HTMLInputElement>('input')!.click();
    fixture.detectChanges();
    expect(action.disabled).toBe(true);
    expect(rendered.querySelector('.matching-totals > div:nth-child(2) strong')?.textContent?.trim())
      .toBe(formatMoney(group.amountCents));

    adjustmentRow.querySelector<HTMLInputElement>('input')!.click();
    fixture.detectChanges();
    expect(store.state().selectedAdjustmentIds).toEqual(group.adjustmentIds);
    expect(rendered.querySelector('.matching-totals > div:nth-child(2) strong')?.textContent?.trim())
      .toBe(formatMoney(group.statementAmountCents));
    expect(rendered.querySelector('.matching-totals > div:nth-child(5) strong')?.textContent?.trim())
      .toBe('-R$ 50,00');
    expect(action.disabled).toBe(false);

    action.click();
    fixture.detectChanges();
    expect(store.state().data.adjustments[0].status).toBe('Conciliado');
    expect(rendered.querySelector('.adjustment-table tbody')?.textContent).toContain('Nenhum ajuste');
  });
});

function formatMoney(amountCents: number): string {
  return `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountCents / 100)}`;
}

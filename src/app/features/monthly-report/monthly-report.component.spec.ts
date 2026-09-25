import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { calculateTotals, filterSales, groupReconciliationEntries, groupSales } from '../../core/demo-data/demo-calculations';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { MonthlyReportComponent } from './monthly-report.component';

function formatCurrency(amountCents: number): string {
  const sign = amountCents < 0 ? '-' : '';
  return `${sign}R$${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amountCents) / 100)}`;
}

function formatDiscount(amountCents: number): string {
  return amountCents === 0 ? formatCurrency(0) : `-${formatCurrency(amountCents)}`;
}

describe('MonthlyReportComponent', () => {
  let queryParamMap = convertToParamMap({});

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyReportComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useFactory: () => ({ snapshot: { queryParamMap } }),
        },
      ],
    }).compileComponents();
  });

  it('aggregates filtered gross, fee, and net values from the central sales dataset', () => {
    queryParamMap = convertToParamMap({
      startDate: '2026-08-08',
      endDate: '2026-08-18',
      acquirer: 'Cielo',
      brand: 'Elo',
    });
    const fixture = TestBed.createComponent(MonthlyReportComponent);
    fixture.detectChanges();

    const dataset = TestBed.inject(DemoStateService).state().data;
    const filters = {
      startDate: '2026-08-08',
      endDate: '2026-08-18',
      acquirer: 'Cielo',
      brand: 'Elo' as const,
      dateBasis: 'sale' as const,
    } as const;
    const sales = filterSales(dataset, filters);
    const expectedGroups = groupSales(dataset, sales);
    const totals = calculateTotals(dataset, sales);
    const rendered = fixture.nativeElement as HTMLElement;
    const rows = [...rendered.querySelectorAll<HTMLTableRowElement>('.monthly-row')];

    expect(rows).toHaveLength(expectedGroups.length);
    expect(rendered.querySelector('.monthly-header h1')?.textContent).toContain(
      '08/08/2026 e 18/08/2026',
    );
    expect(rendered.querySelector('.monthly-company')?.textContent).toContain(
      'CONCILIADOR DEMONSTRAÇÃO',
    );
    expect(rendered.querySelectorAll('.monthly-table thead th')).toHaveLength(11);
    expect(rendered.textContent).not.toContain('Dias');

    for (const [index, row] of rows.entries()) {
      const expected = expectedGroups[index].totals;
      expect(row.cells[2].textContent?.trim()).toBe(formatCurrency(expected.grossAmountCents));
      expect(row.cells[3].textContent?.trim()).toBe(formatDiscount(expected.feeAmountCents));
      expect(row.cells[4].textContent?.trim()).toBe(formatCurrency(0));
      expect(row.cells[6].textContent?.trim()).toBe(formatCurrency(0));
      expect(row.cells[8].textContent?.trim()).toBe(formatCurrency(expected.netAmountCents));
      expect(row.cells[10].textContent?.trim()).toBe('0,00 %');
    }

    expect(rendered.querySelector('.monthly-totals')?.textContent).toContain(
      formatCurrency(totals.grossAmountCents),
    );
    expect(rendered.querySelector('.monthly-totals')?.textContent).toContain(
      formatCurrency(totals.netAmountCents),
    );
    expect(rendered.querySelector('.monthly-totals')?.textContent).toContain(
      formatDiscount(totals.feeAmountCents),
    );
  });

  it('shows the machine rental adjustment in the Visa Electron monthly result', () => {
    queryParamMap = convertToParamMap({
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      brand: 'Visa Electron',
    });
    const fixture = TestBed.createComponent(MonthlyReportComponent);
    fixture.detectChanges();
    const data = TestBed.inject(DemoStateService).state().data;
    const group = groupSales(data, filterSales(data, {
      startDate: '2026-08-01', endDate: '2026-08-31', brand: 'Visa Electron',
    }))[0];
    const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLTableRowElement>('.monthly-row')!;

    expect(group.totals.adjustmentAmountCents).toBe(-5_000);
    expect(row.cells[4].textContent?.trim()).toBe('-R$50,00');
    expect(row.cells[8].textContent?.trim()).toBe(formatCurrency(group.totals.receivedAmountCents));
  });

  it('updates Baixado only after every corresponding manual payment is reconciled, then resets it', () => {
    queryParamMap = convertToParamMap({
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });
    const fixture = TestBed.createComponent(MonthlyReportComponent);
    fixture.detectChanges();

    const stateService = TestBed.inject(DemoStateService);
    const dataset = stateService.state().data;
    const candidateGroup = groupSales(dataset).find((group) => group.saleIds.length > 1)!;
    const candidateSaleIds = new Set(candidateGroup.saleIds);
    const receiptDates = [...new Set(dataset.receipts
      .filter((receipt) => candidateSaleIds.has(receipt.saleId))
      .map((receipt) => receipt.receivedDate))];
    const rendered = fixture.nativeElement as HTMLElement;
    const row = rendered.querySelector<HTMLTableRowElement>(
      `[data-row-key="${candidateGroup.key}"]`,
    )!;

    expect(row.cells[10].textContent?.trim()).toBe('0,00 %');
    expect(receiptDates.length).toBeGreaterThan(1);
    const accountId = dataset.bankAccounts[0].id;
    stateService.selectBankAccount(accountId);
    for (const [index, date] of receiptDates.entries()) {
      stateService.selectStatementDate(date);
      const payment = groupReconciliationEntries(stateService.state().data, accountId, date)
        .find((group) => group.brand === candidateGroup.brand && group.service === candidateGroup.service)!;
      stateService.toggleReceiptGroupSelection(payment.receiptIds);
      for (const adjustmentId of payment.adjustmentIds) stateService.toggleAdjustmentSelection(adjustmentId);
      stateService.toggleStatementGroupSelection(payment.statementLineIds);
      stateService.reconcileSelected();
      fixture.detectChanges();
      if (index < receiptDates.length - 1) {
        expect(row.cells[10].textContent?.trim()).toBe('0,00 %');
      }
    }

    expect(stateService.state().data.receipts
      .filter((receipt) => candidateSaleIds.has(receipt.saleId))
      .every((receipt) => receipt.status === 'Conciliado')).toBe(true);
    fixture.detectChanges();
    expect(row.cells[10].textContent?.trim()).toBe('100,00 %');

    stateService.reset();
    fixture.detectChanges();
    expect(row.cells[10].textContent?.trim()).toBe('0,00 %');
  });
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { calculateTotals, filterSales, groupReconciliationEntries, groupSales } from '../../core/demo-data/demo-calculations';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { SalesReportComponent } from './sales-report.component';

function formatCurrency(amountCents: number): string {
  return `R$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100)}`;
}

describe('SalesReportComponent', () => {
  let queryParamMap = convertToParamMap({});

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesReportComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useFactory: () => ({ snapshot: { queryParamMap } }),
        },
      ],
    }).compileComponents();
  });

  it('filters sales by the URL and derives the general total and groups from the shared dataset', () => {
    queryParamMap = convertToParamMap({
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      brand: 'Visa Electron',
      acquirer: 'Cielo',
    });
    const fixture = TestBed.createComponent(SalesReportComponent);
    fixture.detectChanges();

    const dataset = TestBed.inject(DemoStateService).state().data;
    const filteredSales = filterSales(dataset, {
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      brand: 'Visa Electron',
      acquirer: 'Cielo',
      dateBasis: 'sale',
    });
    const expectedTotals = calculateTotals(dataset, filteredSales);
    const expectedGroupCount = [
      ...new Set(filteredSales.map((sale) => sale.saleDate)),
    ].reduce((count, date) => {
      const dailySales = filteredSales.filter((sale) => sale.saleDate === date);
      return count + groupSales(dataset, dailySales).length;
    }, 0);
    const rendered = fixture.nativeElement as HTMLElement;

    expect(filteredSales.length).toBeGreaterThan(0);
    expect(rendered.querySelector('.general-total .amount-cell')?.textContent?.trim()).toBe(
      formatCurrency(expectedTotals.grossAmountCents),
    );
    expect(rendered.querySelectorAll('.group-row')).toHaveLength(expectedGroupCount);
    for (const row of rendered.querySelectorAll<HTMLTableRowElement>('.group-row')) {
      expect(row.cells[8].textContent?.trim()).toBe('0 %');
      expect(row.cells[9].textContent?.trim()).toBe('100 %');
    }
    expect(rendered.querySelector('.report-header h1')?.textContent).toContain(
      '01/08/2026 e 02/08/2026',
    );
    expect(rendered.querySelector('.column-header')?.textContent).not.toContain('Não Lançado');
  });

  it('expands the exact sales behind a group and preserves D+1 and the group gross sum', () => {
    queryParamMap = convertToParamMap({
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      brand: 'Visa Electron',
      detailLevel: 'summary',
    });
    const fixture = TestBed.createComponent(SalesReportComponent);
    fixture.detectChanges();

    const dataset = TestBed.inject(DemoStateService).state().data;
    const daySales = filterSales(dataset, {
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      brand: 'Visa Electron',
      dateBasis: 'sale',
    });
    const expectedGroup = groupSales(dataset, daySales)[0];
    const rendered = fixture.nativeElement as HTMLElement;
    const groupRow = rendered.querySelector<HTMLElement>('.group-row');
    expect(groupRow).toBeTruthy();
    expect(rendered.querySelectorAll('.detail-table tbody tr')).toHaveLength(0);

    groupRow!.querySelector('button')!.click();
    fixture.detectChanges();

    const detailRows = [...rendered.querySelectorAll<HTMLTableRowElement>('.detail-table tbody tr')];
    expect(detailRows).toHaveLength(expectedGroup.saleIds.length);
    expect(detailRows[0].children[0].textContent?.trim()).toBe('01/08/2026');
    expect(detailRows[0].children[1].textContent?.trim()).toBe('02/08/2026');

    const detailGrossCents = detailRows.reduce((total, row) => {
      const amountText = row.children[8].textContent?.trim() ?? '';
      const amount = Number(amountText.replace('R$ ', '').replaceAll('.', '').replace(',', '.'));
      return total + Math.round(amount * 100);
    }, 0);
    expect(detailGrossCents).toBe(expectedGroup.totals.grossAmountCents);
    expect(rendered.querySelector('.expand-button')?.textContent?.trim()).toBe('−');
  });

  it('starts expanded when Analítico is passed in the query string', () => {
    queryParamMap = convertToParamMap({
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      brand: 'Visa Electron',
      detailLevel: 'detail',
    });
    const fixture = TestBed.createComponent(SalesReportComponent);
    fixture.detectChanges();

    const rendered = fixture.nativeElement as HTMLElement;
    expect(rendered.querySelectorAll('.detail-table tbody tr').length).toBeGreaterThan(0);
    expect(rendered.querySelector('.expand-button')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('toggles the pending-only filter without changing the original dataset', () => {
    const fixture = TestBed.createComponent(SalesReportComponent);
    fixture.detectChanges();
    const originalCount = TestBed.inject(DemoStateService).state().data.sales.length;
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.pending-filter',
    )!;

    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(TestBed.inject(DemoStateService).state().data.sales).toHaveLength(originalCount);
  });

  it('updates Pendente, Validado and detail statuses after a real reconciliation, then restores them', () => {
    queryParamMap = convertToParamMap({
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      brand: 'Visa Electron',
      detailLevel: 'detail',
    });
    const fixture = TestBed.createComponent(SalesReportComponent);
    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;
    const store = TestBed.inject(DemoStateService);
    const accountId = store.state().data.bankAccounts[0].id;
    const payment = groupReconciliationEntries(store.state().data, accountId, '2026-08-02')
      .find((group) => group.brand === 'Visa Electron')!;
    const initialTotal = rendered.querySelector('.general-total .amount-cell')?.textContent;
    expect([...rendered.querySelectorAll<HTMLTableRowElement>('.detail-table tbody tr')]
      .every((row) => row.cells[13].textContent?.trim() === 'Pendente')).toBe(true);

    store.selectBankAccount(accountId);
    store.selectStatementDate('2026-08-02');
    store.toggleReceiptGroupSelection(payment.receiptIds);
    store.toggleStatementGroupSelection(payment.statementLineIds);
    store.reconcileSelected();
    fixture.detectChanges();

    const groupRow = rendered.querySelector<HTMLTableRowElement>('.group-row')!;
    expect(groupRow.cells[8].textContent?.trim()).toBe('0 %');
    expect(groupRow.cells[9].textContent?.trim()).toBe('100 %');
    expect([...rendered.querySelectorAll<HTMLTableRowElement>('.detail-table tbody tr')]
      .every((row) => row.cells[13].textContent?.trim() === 'Conciliado')).toBe(true);
    expect(rendered.querySelector('.general-total .amount-cell')?.textContent).toBe(initialTotal);

    rendered.querySelector<HTMLButtonElement>('.pending-filter')!.click();
    fixture.detectChanges();
    expect(rendered.querySelectorAll('.group-row')).toHaveLength(0);

    store.reset();
    fixture.detectChanges();
    expect(rendered.querySelectorAll('.group-row')).toHaveLength(1);
    expect(rendered.querySelector<HTMLTableRowElement>('.group-row')!.cells[8].textContent?.trim()).toBe('0 %');
    expect(rendered.querySelector<HTMLTableRowElement>('.group-row')!.cells[9].textContent?.trim()).toBe('100 %');
    expect([...rendered.querySelectorAll<HTMLTableRowElement>('.detail-table tbody tr')]
      .every((row) => row.cells[13].textContent?.trim() === 'Pendente')).toBe(true);
  });
});

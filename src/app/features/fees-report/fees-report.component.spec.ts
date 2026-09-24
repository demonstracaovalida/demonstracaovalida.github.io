import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { filterSales, getRateBasisPointsForService } from '../../core/demo-data/demo-calculations';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { FeesReportComponent } from './fees-report.component';

function formatRate(rateBasisPoints: number): string {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rateBasisPoints / 100)} %`;
}

describe('FeesReportComponent', () => {
  let queryParamMap = convertToParamMap({});

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeesReportComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useFactory: () => ({ snapshot: { queryParamMap } }),
        },
      ],
    }).compileComponents();
  });

  it('groups filtered data by its deterministic fee configuration and shows both source rates', () => {
    queryParamMap = convertToParamMap({
      startDate: '2026-08-08',
      endDate: '2026-08-08',
      acquirer: 'Cielo',
      brand: 'Ticket',
    });
    const fixture = TestBed.createComponent(FeesReportComponent);
    fixture.detectChanges();

    const dataset = TestBed.inject(DemoStateService).state().data;
    const selectedSales = filterSales(dataset, {
      startDate: '2026-08-08',
      endDate: '2026-08-08',
      acquirer: 'Cielo',
      brand: 'Ticket',
      dateBasis: 'sale',
    });
    const feeBySaleId = new Map(dataset.fees.map((fee) => [fee.saleId, fee]));
    const expected = new Map<string, { contract: number; practiced: number }>();
    for (const sale of selectedSales) {
      const fee = feeBySaleId.get(sale.id)!;
      const key = [
        sale.acquirer,
        sale.brand,
        sale.service,
        sale.financing,
        fee.contractRateBasisPoints,
      ].join('|');
      expected.set(key, {
        contract: fee.contractRateBasisPoints,
        practiced: fee.practicedRateBasisPoints,
      });
      expect(fee.practicedRateBasisPoints).toBe(getRateBasisPointsForService(sale.service));
      expect([-2, 0, 2]).toContain(
        fee.contractRateBasisPoints - fee.practicedRateBasisPoints,
      );
    }

    const rendered = fixture.nativeElement as HTMLElement;
    const rows = [...rendered.querySelectorAll<HTMLTableRowElement>('.fee-row')];
    expect(rows).toHaveLength(expected.size);
    expect(rendered.querySelector('.fees-header h1')?.textContent).toContain(
      '08/08/2026 e 08/08/2026',
    );
    expect(rendered.querySelector('.fees-company')?.textContent).toContain(
      'CONCILIADOR DEMONSTRAÇÃO',
    );

    for (const row of rows) {
      const rates = expected.get(row.dataset['configKey']!);
      expect(rates).toBeDefined();
      expect(row.cells[3].textContent?.trim()).toBe('Ticket');
      expect(row.cells[6].textContent?.trim()).toBe(formatRate(rates!.contract));
      expect(row.cells[7].textContent?.trim()).toBe(formatRate(rates!.practiced));
    }
  });

  it('keeps contract rates stable when rerendered and allows collapsing the acquirer group', () => {
    const fixture = TestBed.createComponent(FeesReportComponent);
    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;
    const rateSnapshot = [...rendered.querySelectorAll<HTMLTableRowElement>('.fee-row')].map(
      (row) => [row.cells[6].textContent?.trim(), row.cells[7].textContent?.trim()],
    );

    fixture.detectChanges();
    expect(
      [...rendered.querySelectorAll<HTMLTableRowElement>('.fee-row')].map((row) => [
        row.cells[6].textContent?.trim(),
        row.cells[7].textContent?.trim(),
      ]),
    ).toEqual(rateSnapshot);

    rendered.querySelector<HTMLButtonElement>('.acquirer-toggle')!.click();
    fixture.detectChanges();
    expect(rendered.querySelectorAll('.fee-row')).toHaveLength(0);
    expect(rendered.querySelector('.acquirer-toggle')?.getAttribute('aria-expanded')).toBe('false');

    rendered.querySelector<HTMLButtonElement>('.acquirer-toggle')!.click();
    fixture.detectChanges();
    expect(rendered.querySelectorAll('.fee-row').length).toBeGreaterThan(0);
  });
});

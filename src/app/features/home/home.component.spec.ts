import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { calculateTotals, filterSales } from '../../core/demo-data/demo-calculations';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { HomeComponent } from './home.component';

function formatCurrency(amountCents: number): string {
  return `R$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100)}`;
}

describe('HomeComponent', () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomeComponent] }).compileComponents();
  });

  it('derives the three summary cards and daily chart from the Sprint 1 dataset', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const state = TestBed.inject(DemoStateService).state();
    const sales = filterSales(state.data, {
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      dateBasis: 'sale',
    });
    const totals = calculateTotals(state.data, sales);
    const rendered = fixture.nativeElement as HTMLElement;
    const cardValues = rendered.querySelectorAll<HTMLElement>('.summary-value');
    const dateLabels = rendered.querySelectorAll<SVGTextElement>('svg.sales-chart text.date-label');
    const barCount = [...rendered.querySelectorAll('svg.sales-chart rect')].filter((bar) =>
      bar.querySelector('title'),
    ).length;

    expect(cardValues).toHaveLength(3);
    expect(cardValues[0].textContent?.trim()).toBe(formatCurrency(totals.grossAmountCents));
    expect(cardValues[1].textContent?.trim()).toBe(formatCurrency(totals.receivedAmountCents));
    expect(cardValues[2].textContent?.trim()).toBe(formatCurrency(totals.feeAmountCents));
    expect(barCount).toBe(31);
    expect(dateLabels).toHaveLength(31);
    expect([...dateLabels].every((label) => /^\d{2}\/08$/.test(label.textContent?.trim() ?? ''))).toBe(
      true,
    );
  });

  it('does not hard-code the chart viewport to the reference PNG dimensions', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const chart = (fixture.nativeElement as HTMLElement).querySelector('svg.sales-chart');
    expect(chart?.hasAttribute('viewBox')).toBe(false);
    expect(chart?.hasAttribute('width')).toBe(false);
  });

  it('opens a sales report in a new tab with its filters and keeps dashboard totals unchanged', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const state = TestBed.inject(DemoStateService).state();
    const expected = calculateTotals(state.data);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const brand = 'Visa Electron';
    const component = fixture.componentInstance as unknown as {
      acquirer: string;
      brand: string;
      detailLevel: string;
      endDate: string;
      generate: () => void;
      reportType: string;
      startDate: string;
      submittedFilters: () => unknown;
    };
    component.startDate = '2026-08-01';
    component.endDate = '2026-08-31';
    component.acquirer = 'all';
    component.brand = brand;
    component.reportType = 'sales';
    component.detailLevel = 'detail';
    component.generate();
    fixture.detectChanges();

    expect(component.submittedFilters()).toEqual({
      reportType: 'sales',
      detailLevel: 'detail',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      dateBasis: 'sale',
      acquirer: undefined,
      brand,
    });
    expect(openSpy).toHaveBeenCalledTimes(1);
    const [reportUrl, target] = openSpy.mock.calls[0];
    const parsedUrl = new URL(String(reportUrl), 'http://localhost');
    expect(parsedUrl.pathname).toBe('/relatorio-vendas');
    expect(parsedUrl.searchParams.get('reportType')).toBe('sales');
    expect(parsedUrl.searchParams.get('detailLevel')).toBe('detail');
    expect(parsedUrl.searchParams.get('startDate')).toBe('2026-08-01');
    expect(parsedUrl.searchParams.get('endDate')).toBe('2026-08-31');
    expect(parsedUrl.searchParams.get('dateBasis')).toBe('sale');
    expect(parsedUrl.searchParams.get('acquirer')).toBe('all');
    expect(parsedUrl.searchParams.get('brand')).toBe(brand);
    expect(target).toBe('_blank');

    const rendered = fixture.nativeElement as HTMLElement;
    const dailyGross = new Map<string, number>();
    for (const sale of state.data.sales) {
      dailyGross.set(sale.saleDate, (dailyGross.get(sale.saleDate) ?? 0) + sale.grossAmountCents);
    }

    expect(rendered.querySelector('.summary-panel .summary-value')?.textContent?.trim()).toBe(
      formatCurrency(expected.grossAmountCents),
    );
    const chartBars = [...rendered.querySelectorAll('svg.sales-chart rect')].filter((bar) =>
      bar.querySelector('title'),
    );
    expect(chartBars).toHaveLength(31);
    for (const bar of chartBars) {
      const [day, month, year] = bar.querySelector('title')!.textContent!.split(' — ')[0].split('/');
      const date = `${year}-${month}-${day}`;
      expect(bar.querySelector('title')?.textContent).toBe(
        `${day}/${month}/${year} — ${formatCurrency(dailyGross.get(date) ?? 0)}`,
      );
    }
  });

  it('opens the fees report with the selected period, acquirer, and brand', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const component = fixture.componentInstance as unknown as {
      acquirer: string;
      brand: string;
      endDate: string;
      generate: () => void;
      reportType: string;
      startDate: string;
    };
    component.reportType = 'fees';
    component.startDate = '2026-08-08';
    component.endDate = '2026-08-22';
    component.acquirer = 'Cielo';
    component.brand = 'Ticket';

    component.generate();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [reportUrl, target] = openSpy.mock.calls[0];
    const parsedUrl = new URL(String(reportUrl), 'http://localhost');
    expect(parsedUrl.pathname).toBe('/relatorio-taxas');
    expect(parsedUrl.searchParams.get('reportType')).toBe('fees');
    expect(parsedUrl.searchParams.get('startDate')).toBe('2026-08-08');
    expect(parsedUrl.searchParams.get('endDate')).toBe('2026-08-22');
    expect(parsedUrl.searchParams.get('acquirer')).toBe('Cielo');
    expect(parsedUrl.searchParams.get('brand')).toBe('Ticket');
    expect(target).toBe('_blank');
  });

  it('opens the monthly report with the selected filters in a new tab', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const component = fixture.componentInstance as unknown as {
      acquirer: string;
      brand: string;
      detailLevel: string;
      endDate: string;
      generate: () => void;
      reportType: string;
      startDate: string;
    };
    component.reportType = 'monthly';
    component.detailLevel = 'summary';
    component.startDate = '2026-08-05';
    component.endDate = '2026-08-27';
    component.acquirer = 'Cielo';
    component.brand = 'Elo';

    component.generate();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [reportUrl, target] = openSpy.mock.calls[0];
    const parsedUrl = new URL(String(reportUrl), 'http://localhost');
    expect(parsedUrl.pathname).toBe('/resultado-mensal');
    expect(parsedUrl.searchParams.get('reportType')).toBe('monthly');
    expect(parsedUrl.searchParams.get('detailLevel')).toBe('summary');
    expect(parsedUrl.searchParams.get('startDate')).toBe('2026-08-05');
    expect(parsedUrl.searchParams.get('endDate')).toBe('2026-08-27');
    expect(parsedUrl.searchParams.get('dateBasis')).toBe('sale');
    expect(parsedUrl.searchParams.get('acquirer')).toBe('Cielo');
    expect(parsedUrl.searchParams.get('brand')).toBe('Elo');
    expect(target).toBe('_blank');
  });
});

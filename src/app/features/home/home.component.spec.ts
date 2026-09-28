import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { calculateTotals, filterSales } from '../../core/demo-data/demo-calculations';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { TutorialService } from '../../core/tutorial/tutorial.service';
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

  it('shows the welcome notice only until Ok is clicked in the current app instance', () => {
    const firstVisit = TestBed.createComponent(HomeComponent);
    firstVisit.detectChanges();

    const firstScreen = firstVisit.nativeElement as HTMLElement;
    expect(firstScreen.querySelector('[role="dialog"]')?.textContent).toContain(
      'Bem-vindo à demonstração do Valida',
    );

    firstScreen.querySelector<HTMLButtonElement>('.welcome-confirm')!.click();
    firstVisit.detectChanges();
    expect(firstScreen.querySelector('[role="dialog"]')?.textContent).toContain(
      'Deseja iniciar o tutorial da prévia?',
    );

    firstScreen.querySelector<HTMLButtonElement>('.welcome-decline')!.click();
    firstVisit.detectChanges();
    expect(firstScreen.querySelector('[role="dialog"]')).toBeNull();

    firstVisit.destroy();
    const returnToHome = TestBed.createComponent(HomeComponent);
    returnToHome.detectChanges();
    expect((returnToHome.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
  });

  it('starts the optional tutorial only when Sim is chosen', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const screen = fixture.nativeElement as HTMLElement;
    const tutorial = TestBed.inject(TutorialService);

    screen.querySelector<HTMLButtonElement>('.welcome-confirm')!.click();
    fixture.detectChanges();
    expect(tutorial.step()).toBeNull();
    screen.querySelector<HTMLButtonElement>('.welcome-choice .welcome-confirm')!.click();
    fixture.detectChanges();
    expect(tutorial.step()?.id).toBe('home-cards');
    expect(screen.querySelector('.welcome-overlay')).toBeNull();
  });

  it('greys out future reports only during the tutorial', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const tutorial = TestBed.inject(TutorialService);
    const options = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLOptionElement>(
      '#report-type option',
    );

    expect(options[1].disabled).toBe(false);
    expect(options[2].disabled).toBe(false);
    expect(options[3].disabled).toBe(false);
    tutorial.startHome();
    fixture.detectChanges();
    expect(options[1].disabled).toBe(false);
    expect(options[2].disabled).toBe(true);
    expect(options[3].disabled).toBe(true);
    tutorial.stop();
    fixture.detectChanges();
    expect(options[1].disabled).toBe(false);
    expect(options[2].disabled).toBe(false);
    expect(options[3].disabled).toBe(false);
  });

  it('generates Sales with the unchanged preset August dates during the tutorial', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const tutorial = TestBed.inject(TutorialService);
    const screen = fixture.nativeElement as HTMLElement;
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({ postMessage: vi.fn() } as unknown as Window);
    const component = fixture.componentInstance as unknown as { reportType: string; generate: () => void };

    expect(screen.querySelector<HTMLInputElement>('#start-date')?.value).toBe('2026-08-01');
    expect(screen.querySelector<HTMLInputElement>('#end-date')?.value).toBe('2026-08-31');
    tutorial.startHome();
    tutorial.next();
    tutorial.next();
    tutorial.observe('home-report-type', 'sales');
    component.reportType = 'sales';
    tutorial.next();
    expect(tutorial.step()?.id).toBe('home-dates');
    tutorial.next();
    expect(tutorial.step()?.id).toBe('home-generate');
    component.generate();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = new URL(String(openSpy.mock.calls[0][0]), 'http://localhost');
    expect(url.pathname).toBe('/relatorio-vendas');
    expect(url.searchParams.get('startDate')).toBe('2026-08-01');
    expect(url.searchParams.get('endDate')).toBe('2026-08-31');
    expect(url.searchParams.get('tutorial')).toBe('report');
    expect(tutorial.step()?.id).toBe('report-wait');
  });

  it('prevents empty, out-of-month, and reversed dates from generating a report', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const screen = fixture.nativeElement as HTMLElement;
    const start = screen.querySelector<HTMLInputElement>('#start-date')!;
    const end = screen.querySelector<HTMLInputElement>('#end-date')!;
    const generateButton = screen.querySelector<HTMLButtonElement>('.filter-actions button')!;
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const component = fixture.componentInstance as unknown as {
      reportType: string;
      generate: () => void;
    };
    component.reportType = 'sales';
    const enterDate = async (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      fixture.detectChanges();
    };

    expect(start.min).toBe('2026-08-01');
    expect(start.max).toBe('2026-08-31');
    expect(end.min).toBe('2026-08-01');
    expect(end.max).toBe('2026-08-31');

    await enterDate(end, '2026-08-10');
    expect(start.max).toBe('2026-08-10');
    await enterDate(start, '2026-08-20');
    expect(end.min).toBe('2026-08-20');
    expect(generateButton.disabled).toBe(true);
    expect(screen.querySelector('#date-error')?.textContent).toContain('igual ou anterior');
    component.generate();
    expect(openSpy).not.toHaveBeenCalled();

    await enterDate(end, '2026-08-20');
    expect(generateButton.disabled).toBe(false);
    expect(screen.querySelector('#date-error')).toBeNull();
    component.generate();
    expect(openSpy).toHaveBeenCalledTimes(1);

    await enterDate(start, '2026-09-01');
    expect(generateButton.disabled).toBe(true);
    expect(screen.querySelector('#date-error')?.textContent).toContain('01/08/2026 e 31/08/2026');
    component.generate();
    expect(openSpy).toHaveBeenCalledTimes(1);

    await enterDate(start, '');
    expect(generateButton.disabled).toBe(true);
    expect(screen.querySelector('#date-error')?.textContent).toContain('Preencha');
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
    expect(dateLabels.length).toBeGreaterThan(0);
    expect(dateLabels.length).toBeLessThanOrEqual(barCount);
    expect(dateLabels[0].textContent?.trim()).toBe('01/08');
    expect(dateLabels[dateLabels.length - 1].textContent?.trim()).toBe('31/08');
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

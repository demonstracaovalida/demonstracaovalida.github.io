import { CommonModule, Location } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { calculateTotals } from '../../core/demo-data/demo-calculations';
import type {
  DemoFilters,
  DetailLevel,
  IsoDate,
  PaymentBrand,
  ReportType,
} from '../../core/demo-data/demo-data.models';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { ReportWindowHandoffService } from '../../core/demo-data/report-window-handoff.service';
import { TutorialService } from '../../core/tutorial/tutorial.service';
import { HomeWelcomeService } from './home-welcome.service';

const PLOT_LEFT = 115;
const PLOT_RIGHT_INSET = 15;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 172;
const MIN_DATE_LABEL_SPACING = 32;
const DEMO_START_DATE = '2026-08-01';
const DEMO_END_DATE = '2026-08-31';
const BAR_COLORS = [
  '#bc57bd',
  '#dd788a',
  '#ffcc82',
  '#dbe96d',
  '#99d96f',
  '#7bd8b7',
  '#78e0e4',
  '#5064e7',
  '#8184ce',
  '#9367ca',
];

interface DailySalesPoint {
  readonly date: IsoDate;
  readonly amountCents: number;
}

interface ChartBar extends DailySalesPoint {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly dayLabel: string;
  readonly centerX: number;
  readonly showDateLabel: boolean;
}

interface ChartTick {
  readonly y: number;
  readonly label: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css', './home-mobile.css', './home-welcome.css', './home-date-validation.css'],
})
export class HomeComponent {
  private readonly demoState = inject(DemoStateService);
  private readonly reportHandoff = inject(ReportWindowHandoffService);
  private readonly location = inject(Location);
  protected readonly tutorial = inject(TutorialService);
  protected readonly welcome = inject(HomeWelcomeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chartElement = viewChild.required<ElementRef<SVGSVGElement>>('salesChart');
  private readonly chartWidth = signal(1000);
  private readonly numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  protected reportType: ReportType | '' = '';
  protected detailLevel: DetailLevel = 'summary';
  protected startDate = DEMO_START_DATE;
  protected endDate = DEMO_END_DATE;
  protected readonly minimumDate = DEMO_START_DATE;
  protected readonly maximumDate = DEMO_END_DATE;
  protected acquirer = 'all';
  protected brand = 'all';

  /** Snapshot for the report flow; dashboard totals remain the full-month summary. */
  protected readonly submittedFilters = signal<DemoFilters | null>(null);

  constructor() {
    afterNextRender(() => {
      const element = this.chartElement().nativeElement;
      const updateWidth = () => {
        if (element.clientWidth > 0) {
          this.chartWidth.set(element.clientWidth);
        }
      };

      updateWidth();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver(updateWidth);
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected readonly acquirers = computed(() =>
    [...new Set(this.demoState.state().data.sales.map((sale) => sale.acquirer))].sort(),
  );
  protected readonly brands = computed(() =>
    [...new Set(this.demoState.state().data.sales.map((sale) => sale.brand))].sort(),
  );

  protected readonly totals = computed(() =>
    calculateTotals(this.demoState.state().data, this.demoState.state().data.sales),
  );

  protected readonly chart = computed(() => {
    const dailyTotals = new Map<string, number>();
    for (const sale of this.demoState.state().data.sales) {
      dailyTotals.set(sale.saleDate, (dailyTotals.get(sale.saleDate) ?? 0) + sale.grossAmountCents);
    }

    const dailyPoints: DailySalesPoint[] = Array.from({ length: 31 }, (_, dayIndex) => {
      const date = `2026-08-${String(dayIndex + 1).padStart(2, '0')}` as IsoDate;
      return { date, amountCents: dailyTotals.get(date) ?? 0 };
    });
    const peakCents = Math.max(...dailyPoints.map((point) => point.amountCents));
    const axisStepCents = this.niceAxisStep(peakCents);
    const axisMaximumCents = axisStepCents * 5;
    const plotHeight = PLOT_BOTTOM - PLOT_TOP;
    const plotRight = Math.max(PLOT_LEFT + 1, this.chartWidth() - PLOT_RIGHT_INSET);
    const plotWidth = plotRight - PLOT_LEFT;
    const slotWidth = plotWidth / dailyPoints.length;
    const barWidth = slotWidth * 0.53;
    const labelInterval = Math.max(1, Math.ceil(MIN_DATE_LABEL_SPACING / slotWidth));

    const bars: ChartBar[] = dailyPoints.map((point, index) => {
      const height = (point.amountCents / axisMaximumCents) * plotHeight;
      const centerX = PLOT_LEFT + slotWidth * (index + 0.5);
      const [, month, day] = point.date.split('-');
      return {
        ...point,
        x: centerX - barWidth / 2,
        y: PLOT_BOTTOM - height,
        width: barWidth,
        height,
        color: BAR_COLORS[index % BAR_COLORS.length],
        dayLabel: `${day}/${month}`,
        centerX,
        showDateLabel: index % labelInterval === 0,
      };
    });

    const ticks: ChartTick[] = Array.from({ length: 6 }, (_, index) => {
      const valueCents = axisStepCents * (5 - index);
      const y = PLOT_TOP + (plotHeight * index) / 5;
      return { y, label: this.formatCurrency(valueCents) };
    });

    return { bars, ticks, plotRight };
  });

  protected formatCurrency(amountCents: number): string {
    return `R$ ${this.numberFormatter.format(amountCents / 100)}`;
  }

  protected get startDateMaximum(): string {
    return this.isValidDemoDate(this.endDate) ? this.endDate : DEMO_END_DATE;
  }

  protected get endDateMinimum(): string {
    return this.isValidDemoDate(this.startDate) ? this.startDate : DEMO_START_DATE;
  }

  protected get dateError(): string | null {
    if (!this.startDate || !this.endDate) return 'Preencha a Data Inicial e a Data Final.';
    if (!this.isValidDemoDate(this.startDate) || !this.isValidDemoDate(this.endDate)) {
      return 'Escolha datas entre 01/08/2026 e 31/08/2026.';
    }
    if (this.startDate > this.endDate) {
      return 'A Data Inicial deve ser igual ou anterior à Data Final.';
    }
    return null;
  }

  protected startTutorial(): void {
    this.welcome.closeTutorialChoice();
    this.tutorial.startHome();
  }

  protected generate(): void {
    if (this.dateError) return;

    const filters: DemoFilters = {
      reportType: this.reportType || undefined,
      detailLevel: this.detailLevel,
      startDate: this.startDate as IsoDate,
      endDate: this.endDate as IsoDate,
      dateBasis: 'sale',
      acquirer: this.acquirer === 'all' ? undefined : this.acquirer,
      brand: this.brand === 'all' ? undefined : (this.brand as PaymentBrand),
    };
    if (this.tutorial.isAwaitingReport() && filters.reportType &&
        !this.tutorial.isReportOptionAvailable(filters.reportType)) return;
    this.submittedFilters.set(filters);

    if (
      filters.reportType === 'sales' ||
      filters.reportType === 'fees' ||
      filters.reportType === 'monthly'
    ) {
      const query = new URLSearchParams({
        reportType: filters.reportType,
        detailLevel: filters.detailLevel ?? 'summary',
        startDate: filters.startDate ?? '2026-08-01',
        endDate: filters.endDate ?? '2026-08-31',
        dateBasis: filters.dateBasis ?? 'sale',
        acquirer: this.acquirer,
        brand: this.brand,
      });
      const route = {
        sales: 'relatorio-vendas',
        fees: 'relatorio-taxas',
        monthly: 'resultado-mensal',
      }[filters.reportType];
      if (this.tutorial.isAwaitingReport()) query.set('tutorial', 'report');
      const reportUrl = this.location.prepareExternalUrl(`/${route}?${query.toString()}`);
      const reportWindow = this.reportHandoff.openReport(reportUrl);
      if (this.tutorial.isAwaitingReport()) {
        this.tutorial.registerReportWindow(reportWindow, filters.reportType);
      }
      if (reportWindow) this.tutorial.observe('home-generate');
    }
  }

  private niceAxisStep(peakCents: number): number {
    const rawStep = Math.max(1, Math.ceil((peakCents || 10_000) / 5));
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const normalized = rawStep / magnitude;
    const niceMultiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return niceMultiplier * magnitude;
  }

  private isValidDemoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      value >= DEMO_START_DATE && value <= DEMO_END_DATE;
  }
}

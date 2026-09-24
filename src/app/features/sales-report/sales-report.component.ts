import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, type ParamMap } from '@angular/router';
import {
  basisPointsToPercent,
  calculateTotals,
  filterSales,
  groupSales,
} from '../../core/demo-data/demo-calculations';
import type {
  DemoDataset,
  DemoFilters,
  DemoSale,
  IsoDate,
  PaymentBrand,
  PaymentReceipt,
  SaleFee,
  SaleGroup,
} from '../../core/demo-data/demo-data.models';
import { DemoStateService } from '../../core/demo-data/demo-state.service';

interface SaleDetails {
  readonly sale: DemoSale;
  readonly fee: SaleFee;
  readonly receipt: PaymentReceipt;
}

interface SalesReportGroup extends SaleGroup {
  readonly date: IsoDate;
  readonly key: string;
  readonly details: readonly SaleDetails[];
  readonly contractRateBasisPoints: number;
  readonly practicedRateBasisPoints: number;
  readonly pendingPercent: number;
  readonly validatedPercent: number;
}

interface SalesReportDay {
  readonly date: IsoDate;
  readonly groups: readonly SalesReportGroup[];
  readonly grossAmountCents: number;
}

const FIRST_DAY = '2026-08-01' as IsoDate;
const LAST_DAY = '2026-08-31' as IsoDate;

function dateFromQuery(value: string | null, fallback: IsoDate): IsoDate {
  return value && /^2026-08-(?:0[1-9]|[12]\d|3[01])$/.test(value)
    ? (value as IsoDate)
    : fallback;
}

function filtersFromQuery(
  params: ParamMap,
  dataset: DemoDataset,
): DemoFilters {
  const requestedAcquirer = params.get('acquirer');
  const requestedBrand = params.get('brand');
  const detailLevel = params.get('detailLevel') === 'detail' ? 'detail' : 'summary';

  return {
    reportType: 'sales',
    detailLevel,
    startDate: dateFromQuery(params.get('startDate'), FIRST_DAY),
    endDate: dateFromQuery(params.get('endDate'), LAST_DAY),
    dateBasis: 'sale',
    acquirer:
      requestedAcquirer &&
      requestedAcquirer !== 'all' &&
      dataset.sales.some((sale) => sale.acquirer === requestedAcquirer)
        ? requestedAcquirer
        : undefined,
    brand:
      requestedBrand &&
      requestedBrand !== 'all' &&
      dataset.sales.some((sale) => sale.brand === requestedBrand)
        ? (requestedBrand as PaymentBrand)
        : undefined,
  };
}

function weightedRateBasisPoints(
  details: readonly SaleDetails[],
  rate: (fee: SaleFee) => number,
): number {
  const grossAmountCents = details.reduce((total, item) => total + item.sale.grossAmountCents, 0);
  if (grossAmountCents === 0) {
    return 0;
  }

  return (
    details.reduce(
      (total, item) => total + rate(item.fee) * item.sale.grossAmountCents,
      0,
    ) / grossAmountCents
  );
}

@Component({
  selector: 'app-sales-report',
  imports: [CommonModule],
  templateUrl: './sales-report.component.html',
  styleUrl: './sales-report.component.css',
})
export class SalesReportComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly demoState = inject(DemoStateService);
  private readonly numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  private readonly percentFormatter = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  });

  protected readonly filters = filtersFromQuery(
    this.route.snapshot.queryParamMap,
    this.demoState.state().data,
  );
  protected readonly pendingOnly = signal(false);
  private readonly expansionOverrides = signal<ReadonlyMap<string, boolean>>(new Map());

  private readonly visibleSales = computed(() => {
    const dataset = this.demoState.state().data;
    const matchingSales = filterSales(dataset, this.filters);
    if (!this.pendingOnly()) {
      return matchingSales;
    }

    const pendingSaleIds = new Set(
      dataset.receipts
        .filter((receipt) => receipt.status === 'Pendente')
        .map((receipt) => receipt.saleId),
    );
    return matchingSales.filter((sale) => pendingSaleIds.has(sale.id));
  });

  protected readonly reportDays = computed(() => {
    const dataset = this.demoState.state().data;
    const salesByDate = new Map<IsoDate, DemoSale[]>();
    for (const sale of this.visibleSales()) {
      const salesForDate = salesByDate.get(sale.saleDate) ?? [];
      salesForDate.push(sale);
      salesByDate.set(sale.saleDate, salesForDate);
    }

    return [...salesByDate.entries()]
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, salesForDate]) => {
        const groups = groupSales(dataset, salesForDate).map((group) =>
          this.createReportGroup(dataset, date, group),
        );
        return {
          date,
          groups,
          grossAmountCents: calculateTotals(dataset, salesForDate).grossAmountCents,
        } satisfies SalesReportDay;
      });
  });

  protected readonly reportTotals = computed(() =>
    calculateTotals(this.demoState.state().data, this.visibleSales()),
  );

  protected readonly groupCount = computed(() =>
    this.reportDays().reduce((count, day) => count + day.groups.length, 0),
  );

  protected readonly currentCompany = computed(() =>
    this.demoState.state().data.companies.find((company) => company.isCurrentCompany),
  );

  protected togglePendingOnly(): void {
    this.pendingOnly.update((pendingOnly) => !pendingOnly);
  }

  protected isExpanded(group: SalesReportGroup): boolean {
    return (
      this.expansionOverrides().get(group.key) ?? this.filters.detailLevel === 'detail'
    );
  }

  protected toggleGroup(group: SalesReportGroup): void {
    const nextValue = !this.isExpanded(group);
    this.expansionOverrides.update((overrides) =>
      new Map(overrides).set(group.key, nextValue),
    );
  }

  protected formatCurrency(amountCents: number): string {
    return `R$ ${this.numberFormatter.format(amountCents / 100)}`;
  }

  protected formatRate(rateBasisPoints: number): string {
    return `${this.numberFormatter.format(basisPointsToPercent(rateBasisPoints))} %`;
  }

  protected formatPercent(percent: number): string {
    return `${this.percentFormatter.format(percent)} %`;
  }

  protected formatDate(date: IsoDate): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  private createReportGroup(
    dataset: DemoDataset,
    date: IsoDate,
    group: SaleGroup,
  ): SalesReportGroup {
    const saleById = new Map(dataset.sales.map((sale) => [sale.id, sale]));
    const feeBySaleId = new Map(dataset.fees.map((fee) => [fee.saleId, fee]));
    const receiptBySaleId = new Map(dataset.receipts.map((receipt) => [receipt.saleId, receipt]));
    const details = group.saleIds.map((saleId) => {
      const sale = saleById.get(saleId);
      const fee = feeBySaleId.get(saleId);
      const receipt = receiptBySaleId.get(saleId);
      if (!sale || !fee || !receipt) {
        throw new Error(`Dados incompletos para a venda ${saleId}.`);
      }

      return { sale, fee, receipt };
    });
    const pendingCount = details.filter((item) => item.receipt.status === 'Pendente').length;
    const validatedCount = details.filter((item) => item.receipt.status === 'Conciliado').length;

    return {
      ...group,
      key: `${date}|${group.key}`,
      date,
      details,
      contractRateBasisPoints: weightedRateBasisPoints(
        details,
        (fee) => fee.contractRateBasisPoints,
      ),
      practicedRateBasisPoints: weightedRateBasisPoints(
        details,
        (fee) => fee.practicedRateBasisPoints,
      ),
      pendingPercent: details.length === 0 ? 0 : (validatedCount / details.length) * 100,
      validatedPercent: details.length === 0 ? 0 : (pendingCount / details.length) * 100,
    };
  }
}

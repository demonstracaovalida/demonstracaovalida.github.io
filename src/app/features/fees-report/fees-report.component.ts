import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, type ParamMap } from '@angular/router';
import {
  basisPointsToPercent,
  calculateTotals,
  filterSales,
} from '../../core/demo-data/demo-calculations';
import type {
  DemoDataset,
  DemoFilters,
  DemoSale,
  FinancingType,
  IsoDate,
  PaymentBrand,
  SaleService,
} from '../../core/demo-data/demo-data.models';
import { DemoStateService } from '../../core/demo-data/demo-state.service';

interface FeeConfigurationRow {
  readonly key: string;
  readonly id: string;
  readonly acquirer: string;
  readonly brand: PaymentBrand;
  readonly service: SaleService;
  readonly financing: FinancingType;
  readonly contractRateBasisPoints: number;
  readonly practicedRateBasisPoints: number;
  readonly saleCount: number;
}

interface AcquirerFeeGroup {
  readonly acquirer: string;
  readonly rows: readonly FeeConfigurationRow[];
}

const FIRST_DAY = '2026-08-01' as IsoDate;
const LAST_DAY = '2026-08-31' as IsoDate;

function dateFromQuery(value: string | null, fallback: IsoDate): IsoDate {
  return value && /^2026-08-(?:0[1-9]|[12]\d|3[01])$/.test(value)
    ? (value as IsoDate)
    : fallback;
}

function readFilters(params: ParamMap, dataset: DemoDataset): DemoFilters {
  const requestedAcquirer = params.get('acquirer');
  const requestedBrand = params.get('brand');

  return {
    reportType: 'fees',
    detailLevel: params.get('detailLevel') === 'detail' ? 'detail' : 'summary',
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

function configurationKey(sale: DemoSale, contractRateBasisPoints: number): string {
  return [
    sale.acquirer,
    sale.brand,
    sale.service,
    sale.financing,
    contractRateBasisPoints,
  ].join('|');
}

function identifierFor(index: number): string {
  return `1.${String(index).padStart(3, '0')}`;
}

@Component({
  selector: 'app-fees-report',
  imports: [CommonModule],
  templateUrl: './fees-report.component.html',
  styleUrl: './fees-report.component.css',
})
export class FeesReportComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly demoState = inject(DemoStateService);
  private readonly numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  private readonly collapsedAcquirers = signal<ReadonlySet<string>>(new Set());

  protected readonly filters = readFilters(
    this.route.snapshot.queryParamMap,
    this.demoState.state().data,
  );

  protected readonly rows = computed(() => {
    const dataset = this.demoState.state().data;
    const feeBySaleId = new Map(dataset.fees.map((fee) => [fee.saleId, fee]));
    const stableIdentifiers = new Map<string, number>();
    let nextIdentifier = 1;

    for (const sale of dataset.sales) {
      const fee = feeBySaleId.get(sale.id);
      if (!fee) {
        throw new Error(`Taxa ausente para a venda ${sale.id}.`);
      }

      const key = configurationKey(sale, fee.contractRateBasisPoints);
      if (!stableIdentifiers.has(key)) {
        stableIdentifiers.set(key, nextIdentifier++);
      }
    }

    const groupedSales = new Map<string, DemoSale[]>();
    for (const sale of filterSales(dataset, this.filters)) {
      const fee = feeBySaleId.get(sale.id);
      if (!fee) {
        throw new Error(`Taxa ausente para a venda ${sale.id}.`);
      }

      const key = configurationKey(sale, fee.contractRateBasisPoints);
      const salesForConfiguration = groupedSales.get(key) ?? [];
      salesForConfiguration.push(sale);
      groupedSales.set(key, salesForConfiguration);
    }

    return [...groupedSales].map(([key, salesForConfiguration]) => {
      const representative = salesForConfiguration[0];
      const fee = feeBySaleId.get(representative.id)!;
      // Totals stay sourced from the same sales calculation layer as the other reports.
      const totals = calculateTotals(dataset, salesForConfiguration);

      return {
        key,
        id: identifierFor(stableIdentifiers.get(key)!),
        acquirer: representative.acquirer,
        brand: representative.brand,
        service: representative.service,
        financing: representative.financing,
        contractRateBasisPoints: fee.contractRateBasisPoints,
        practicedRateBasisPoints: fee.practicedRateBasisPoints,
        saleCount: totals.saleCount,
      } satisfies FeeConfigurationRow;
    });
  });

  protected readonly acquirerGroups = computed(() => {
    const groupedRows = new Map<string, FeeConfigurationRow[]>();
    for (const row of this.rows()) {
      const rows = groupedRows.get(row.acquirer) ?? [];
      rows.push(row);
      groupedRows.set(row.acquirer, rows);
    }

    return [...groupedRows].map(([acquirer, rows]) => ({ acquirer, rows })) satisfies AcquirerFeeGroup[];
  });

  protected readonly currentCompany = computed(() =>
    this.demoState.state().data.companies.find((company) => company.isCurrentCompany),
  );

  protected isExpanded(acquirer: string): boolean {
    return !this.collapsedAcquirers().has(acquirer);
  }

  protected toggleAcquirer(acquirer: string): void {
    this.collapsedAcquirers.update((collapsed) => {
      const next = new Set(collapsed);
      if (next.has(acquirer)) {
        next.delete(acquirer);
      } else {
        next.add(acquirer);
      }
      return next;
    });
  }

  protected formatRate(rateBasisPoints: number): string {
    return `${this.numberFormatter.format(basisPointsToPercent(rateBasisPoints))} %`;
  }

  protected formatDate(date: IsoDate): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  protected exitReport(): void {
    window.close();
  }
}

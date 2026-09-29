import { IllustrativeControlDirective } from '../../shared/illustrative-control.directive';
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, type ParamMap } from '@angular/router';
import {
  basisPointsToPercent,
  calculateTotals,
  filterSales,
  groupSales as groupDatasetSales,
} from '../../core/demo-data/demo-calculations';
import type {
  DemoDataset,
  DemoFilters,
  DemoSale,
  IsoDate,
  PaymentBrand,
  SaleFee,
  SaleGroup,
} from '../../core/demo-data/demo-data.models';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { ReportWindowHandoffService } from '../../core/demo-data/report-window-handoff.service';

interface MonthlyReportRow {
  readonly key: string;
  readonly productCode: string;
  readonly brand: PaymentBrand;
  readonly acquirer: string;
  readonly service: SaleGroup['service'];
  readonly financing: SaleGroup['financing'];
  readonly grossAmountCents: number;
  readonly feeAmountCents: number;
  readonly adjustmentsAndFeesCents: number;
  readonly cancellationAmountCents: 0;
  readonly receivedAmountCents: number;
  readonly configuredRateBasisPoints: number;
  readonly acquirerRateBasisPoints: number;
  readonly finalRatePercent: number;
  readonly downloadedPercent: 0 | 100;
}

const FIRST_DAY = '2026-08-01' as IsoDate;
const LAST_DAY = '2026-08-31' as IsoDate;
const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const RATE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function dateFromQuery(value: string | null, fallback: IsoDate): IsoDate {
  return value && /^2026-08-(?:0[1-9]|[12]\d|3[01])$/.test(value)
    ? (value as IsoDate)
    : fallback;
}

function readFilters(params: ParamMap, dataset: DemoDataset): DemoFilters {
  const requestedAcquirer = params.get('acquirer');
  const requestedBrand = params.get('brand');

  return {
    reportType: 'monthly',
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

function weightedRateBasisPoints(
  sales: readonly DemoSale[],
  feeBySaleId: ReadonlyMap<string, SaleFee>,
  getRate: (fee: SaleFee) => number,
): number {
  const grossAmountCents = sales.reduce((sum, sale) => sum + sale.grossAmountCents, 0);
  if (grossAmountCents === 0) {
    return 0;
  }

  return sales.reduce((sum, sale) => {
    const fee = feeBySaleId.get(sale.id);
    if (!fee) {
      throw new Error(`Taxa ausente para a venda ${sale.id}.`);
    }
    return sum + getRate(fee) * sale.grossAmountCents;
  }, 0) / grossAmountCents;
}

function productCodesByBrand(dataset: DemoDataset): ReadonlyMap<PaymentBrand, string> {
  const brands = [...new Set(dataset.sales.map((sale) => sale.brand))];
  return new Map(brands.map((brand, index) => [brand, String(index + 1).padStart(3, '0')]));
}

@Component({
  selector: 'app-monthly-report',
  imports: [CommonModule, IllustrativeControlDirective],
  templateUrl: './monthly-report.component.html',
  styleUrl: './monthly-report.component.css',
})
export class MonthlyReportComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly demoState = inject(DemoStateService);
  private readonly reportHandoff = inject(ReportWindowHandoffService);

  protected readonly filters = readFilters(
    this.route.snapshot.queryParamMap,
    this.demoState.state().data,
  );

  protected readonly visibleSales = computed(() =>
    filterSales(this.demoState.state().data, this.filters),
  );

  protected readonly reportTotals = computed(() =>
    calculateTotals(this.demoState.state().data, this.visibleSales()),
  );

  protected readonly rows = computed(() => {
    const dataset = this.demoState.state().data;
    const feesBySaleId = new Map(dataset.fees.map((fee) => [fee.saleId, fee]));
    const receiptsBySaleId = new Map(dataset.receipts.map((receipt) => [receipt.saleId, receipt]));
    const productCodes = productCodesByBrand(dataset);

    return groupDatasetSales(dataset, this.visibleSales()).map((group) =>
      this.toReportRow(group, feesBySaleId, receiptsBySaleId, productCodes),
    );
  });

  protected readonly currentCompany = computed(() =>
    this.demoState.state().data.companies.find((company) => company.isCurrentCompany),
  );

  protected readonly totalAverageRatePercent = computed(() => {
    const totals = this.reportTotals();
    return totals.grossAmountCents === 0
      ? 0
      : ((totals.feeAmountCents - totals.adjustmentAmountCents) / totals.grossAmountCents) * 100;
  });

  constructor() {
    this.reportHandoff.requestSnapshotFromOpener();
  }

  protected formatCurrency(amountCents: number): string {
    const sign = amountCents < 0 ? '-' : '';
    return `${sign}R$${CURRENCY_FORMATTER.format(Math.abs(amountCents) / 100)}`;
  }

  protected formatDiscount(amountCents: number): string {
    return amountCents === 0 ? this.formatCurrency(0) : `-${this.formatCurrency(amountCents)}`;
  }

  protected formatRateBasisPoints(rateBasisPoints: number): string {
    return this.formatRatePercent(basisPointsToPercent(rateBasisPoints));
  }

  protected formatRatePercent(ratePercent: number): string {
    return `${RATE_FORMATTER.format(ratePercent)} %`;
  }

  protected formatDate(date: IsoDate): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  protected exitReport(): void {
    window.close();
  }

  private toReportRow(
    group: SaleGroup,
    feesBySaleId: ReadonlyMap<string, SaleFee>,
    receiptsBySaleId: ReadonlyMap<string, DemoDataset['receipts'][number]>,
    productCodes: ReadonlyMap<PaymentBrand, string>,
  ): MonthlyReportRow {
    const dataset = this.demoState.state().data;
    const salesById = new Map(dataset.sales.map((sale) => [sale.id, sale]));
    const sales = group.saleIds.map((saleId) => {
      const sale = salesById.get(saleId);
      if (!sale) {
        throw new Error(`Venda ausente para o grupo ${group.key}.`);
      }
      return sale;
    });
    const grossAmountCents = group.totals.grossAmountCents;
    const feeAmountCents = group.totals.feeAmountCents;
    const groupReceipts = sales.map((sale) => {
      const receipt = receiptsBySaleId.get(sale.id);
      if (!receipt) {
        throw new Error(`Recebimento ausente para a venda ${sale.id}.`);
      }
      return receipt;
    });

    return {
      key: group.key,
      productCode: productCodes.get(group.brand) ?? '000',
      brand: group.brand,
      acquirer: group.acquirer,
      service: group.service,
      financing: group.financing,
      grossAmountCents,
      feeAmountCents,
      adjustmentsAndFeesCents: group.totals.adjustmentAmountCents,
      cancellationAmountCents: 0,
      receivedAmountCents: group.totals.receivedAmountCents,
      configuredRateBasisPoints: weightedRateBasisPoints(
        sales,
        feesBySaleId,
        (fee) => fee.contractRateBasisPoints,
      ),
      acquirerRateBasisPoints: weightedRateBasisPoints(
        sales,
        feesBySaleId,
        (fee) => fee.practicedRateBasisPoints,
      ),
      finalRatePercent: grossAmountCents === 0 ? 0
        : ((feeAmountCents - group.totals.adjustmentAmountCents) / grossAmountCents) * 100,
      downloadedPercent:
        groupReceipts.length > 0 && groupReceipts.every((receipt) => receipt.status === 'Conciliado')
          ? 100
          : 0,
    };
  }
}

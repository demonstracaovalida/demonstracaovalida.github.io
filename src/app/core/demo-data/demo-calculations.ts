import {
  type BankStatementLine,
  type ConciliationSelectionTotals,
  type DemoDataset,
  type DemoFilters,
  type DemoSale,
  type DemoTotals,
  type IsoDate,
  type ReconciliationGroup,
  type ReceiptStatus,
  type SaleGroup,
  type SaleService,
} from './demo-data.models';

const BASIS_POINTS_PER_PERCENT = 100;
const BASIS_POINTS_PER_WHOLE = 10_000;

export function getContractRateBasisPointsForService(service: SaleService): number {
  switch (service) {
    case 'Débito':
      return 75;
    case 'Crédito':
      return 110;
    case 'Voucher':
      return 360;
  }
}

export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / BASIS_POINTS_PER_PERCENT;
}

export function calculateFeeAmountCents(grossAmountCents: number, rateBasisPoints: number): number {
  assertNonNegativeSafeInteger(grossAmountCents, 'Valor bruto');
  assertNonNegativeSafeInteger(rateBasisPoints, 'Taxa em pontos-base');

  return Math.round((grossAmountCents * rateBasisPoints) / BASIS_POINTS_PER_WHOLE);
}

export function calculateNetAmountCents(grossAmountCents: number, feeAmountCents: number): number {
  assertNonNegativeSafeInteger(grossAmountCents, 'Valor bruto');
  assertNonNegativeSafeInteger(feeAmountCents, 'Valor da taxa');
  if (feeAmountCents > grossAmountCents) {
    throw new RangeError('O valor da taxa não pode superar o valor bruto.');
  }

  return grossAmountCents - feeAmountCents;
}

export function getNextCalendarDate(date: IsoDate): IsoDate {
  const [year, month, day] = parseIsoDate(date);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

  return [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, '0'),
    String(nextDate.getUTCDate()).padStart(2, '0'),
  ].join('-') as IsoDate;
}

function parseIsoDate(date: IsoDate): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new RangeError(`Data inválida: ${date}. Use o formato AAAA-MM-DD.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new RangeError(`Data inválida: ${date}.`);
  }

  return [year, month, day];
}

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} deve ser um inteiro não negativo.`);
  }
}

export function filterSales(dataset: DemoDataset, filters: DemoFilters): DemoSale[] {
  const receiptDateBySaleId = new Map(
    dataset.receipts.map((receipt) => [receipt.saleId, receipt.receivedDate]),
  );
  const dateBasis = filters.dateBasis ?? 'sale';

  return dataset.sales.filter((sale) => {
    const date = dateBasis === 'receipt' ? receiptDateBySaleId.get(sale.id) : sale.saleDate;
    if (!date) {
      return false;
    }

    return (
      (!filters.startDate || date >= filters.startDate) &&
      (!filters.endDate || date <= filters.endDate) &&
      (!filters.acquirer || sale.acquirer === filters.acquirer) &&
      (!filters.brand || sale.brand === filters.brand) &&
      (!filters.service || sale.service === filters.service)
    );
  });
}

export function calculateTotals(
  dataset: DemoDataset,
  sales: readonly DemoSale[] = dataset.sales,
): DemoTotals {
  const feeBySaleId = new Map(dataset.fees.map((fee) => [fee.saleId, fee]));
  const saleIds = new Set(sales.map((sale) => sale.id));
  const receipts = dataset.receipts.filter((receipt) => saleIds.has(receipt.saleId));
  const receiptIds = new Set(receipts.map((receipt) => receipt.id));
  const adjustments = dataset.adjustments.filter((adjustment) => receiptIds.has(adjustment.receiptId));
  const statementLines = dataset.statementLines.filter((line) => receiptIds.has(line.receiptId));

  let grossAmountCents = 0;
  let feeAmountCents = 0;
  let netAmountCents = 0;

  for (const sale of sales) {
    const fee = feeBySaleId.get(sale.id);
    if (!fee) {
      throw new Error(`Taxa ausente para a venda ${sale.id}.`);
    }

    grossAmountCents += sale.grossAmountCents;
    feeAmountCents += fee.amountCents;
    netAmountCents += calculateNetAmountCents(sale.grossAmountCents, fee.amountCents);
  }

  return {
    saleCount: sales.length,
    grossAmountCents,
    feeAmountCents,
    netAmountCents,
    adjustmentAmountCents: sumAmounts(adjustments.map((adjustment) => adjustment.amountCents)),
    receivedAmountCents: sumAmounts(receipts.map((receipt) => receipt.amountCents)) +
      sumAmounts(adjustments.map((adjustment) => adjustment.amountCents)),
    statementAmountCents: sumAmounts(statementLines.map((line) => line.amountCents)),
  };
}

export function groupSales(
  dataset: DemoDataset,
  sales: readonly DemoSale[] = dataset.sales,
): SaleGroup[] {
  const groups = new Map<string, DemoSale[]>();

  for (const sale of sales) {
    const key = [sale.acquirer, sale.brand, sale.service, sale.financing].join('|');
    const group = groups.get(key) ?? [];
    group.push(sale);
    groups.set(key, group);
  }

  return [...groups].map(([key, groupSales]) => {
    const representative = groupSales[0];
    return {
      key,
      acquirer: representative.acquirer,
      brand: representative.brand,
      service: representative.service,
      financing: representative.financing,
      saleIds: groupSales.map((sale) => sale.id),
      totals: calculateTotals(dataset, groupSales),
    };
  });
}

export function getStatementDescription(sale: Pick<DemoSale, 'acquirer' | 'brand' | 'service'>): string {
  const service = sale.brand === 'Mastercard' || sale.brand === 'Elo' ? ` ${sale.service}` : '';
  return `TED ${sale.acquirer.toLocaleUpperCase('pt-BR')} - ${sale.brand}${service}`;
}

/** Consolidates payments by deposit day, acquiring network, brand and service. */
export function groupReconciliationEntries(
  dataset: DemoDataset,
  accountId: string,
  date: IsoDate,
  status: ReceiptStatus = 'Pendente',
): ReconciliationGroup[] {
  const salesById = new Map(dataset.sales.map((sale) => [sale.id, sale]));
  const receiptsById = new Map(dataset.receipts.map((receipt) => [receipt.id, receipt]));
  const adjustmentsById = new Map(dataset.adjustments.map((adjustment) => [adjustment.id, adjustment]));
  const groups = new Map<string, {
    sale: DemoSale;
    receiptIds: string[];
    adjustmentIds: string[];
    statementLineIds: string[];
    installmentCount: number;
    amountCents: number;
    statementAmountCents: number;
  }>();

  for (const line of dataset.statementLines) {
    if (line.accountId !== accountId || line.transactionDate !== date || line.status !== status) continue;
    const receipt = receiptsById.get(line.receiptId);
    const sale = receipt && salesById.get(receipt.saleId);
    const adjustment = line.adjustmentId ? adjustmentsById.get(line.adjustmentId) : undefined;
    if (!receipt || !sale || receipt.status !== status ||
        (line.adjustmentId && (!adjustment || adjustment.status !== status ||
          adjustment.receiptId !== receipt.id || adjustment.transactionDate !== date ||
          adjustment.acquirer !== sale.acquirer || adjustment.brand !== sale.brand)) ||
        receipt.amountCents + (adjustment?.amountCents ?? 0) !== line.amountCents) {
      throw new Error(`Lançamento sem recebimento correspondente: ${line.id}.`);
    }

    const key = [date, sale.acquirer, sale.brand, sale.service, sale.financing].join('|');
    const group = groups.get(key) ?? {
      sale,
      receiptIds: [],
      adjustmentIds: [],
      statementLineIds: [],
      installmentCount: 0,
      amountCents: 0,
      statementAmountCents: 0,
    };
    group.receiptIds.push(receipt.id);
    if (adjustment) group.adjustmentIds.push(adjustment.id);
    group.statementLineIds.push(line.id);
    group.installmentCount += sale.installmentCount;
    group.amountCents += receipt.amountCents;
    group.statementAmountCents += line.amountCents;
    groups.set(key, group);
  }

  return [...groups].map(([key, group]) => ({
    key,
    acquirer: group.sale.acquirer,
    brand: group.sale.brand,
    service: group.sale.service,
    financing: group.sale.financing,
    saleDate: group.sale.saleDate,
    receivedDate: date,
    description: getStatementDescription(group.sale),
    receiptIds: group.receiptIds,
    adjustmentIds: group.adjustmentIds,
    statementLineIds: group.statementLineIds,
    installmentCount: group.installmentCount,
    amountCents: group.amountCents,
    statementAmountCents: group.statementAmountCents,
  }));
}

export function calculateDifference(statementAmountCents: number, counterpartAmountCents: number): number {
  return statementAmountCents - counterpartAmountCents;
}

export function calculateConciliationSelectionTotals(
  selectedReceiptIds: readonly string[],
  selectedStatementLineIds: readonly string[],
  receipts: DemoDataset['receipts'],
  statementLines: DemoDataset['statementLines'],
  selectedAdjustmentIds: readonly string[] = [],
  adjustments: DemoDataset['adjustments'] = [],
): ConciliationSelectionTotals {
  const receiptIds = new Set(selectedReceiptIds);
  const adjustmentIds = new Set(selectedAdjustmentIds);
  const statementLineIds = new Set(selectedStatementLineIds);
  const selectedReceipts = receipts.filter((receipt) => receiptIds.has(receipt.id));
  const selectedAdjustments = adjustments.filter((adjustment) => adjustmentIds.has(adjustment.id));
  const selectedStatementLines = statementLines.filter((line) => statementLineIds.has(line.id));
  const receiptAmountCents = sumAmounts(selectedReceipts.map((receipt) => receipt.amountCents));
  const adjustmentAmountCents = sumAmounts(selectedAdjustments.map((adjustment) => adjustment.amountCents));
  const counterpartAmountCents = receiptAmountCents + adjustmentAmountCents;
  const statementAmountCents = sumAmounts(selectedStatementLines.map((line) => line.amountCents));

  return {
    statementAmountCents,
    receiptAmountCents,
    adjustmentAmountCents,
    counterpartAmountCents,
    differenceCents: calculateDifference(statementAmountCents, counterpartAmountCents),
    statementLineCount: selectedStatementLines.length,
    receiptCount: selectedReceipts.length,
    adjustmentCount: selectedAdjustments.length,
  };
}

export function canReconcileSelection(
  selectedReceiptIds: readonly string[],
  selectedStatementLineIds: readonly string[],
  dataset: DemoDataset,
  selectedAdjustmentIds: readonly string[] = [],
): boolean {
  if (selectedReceiptIds.length === 0 || selectedStatementLineIds.length === 0) {
    return false;
  }

  const receiptIds = new Set(selectedReceiptIds);
  const adjustmentIds = new Set(selectedAdjustmentIds);
  const statementLineIds = new Set(selectedStatementLineIds);
  if (receiptIds.size !== selectedReceiptIds.length ||
      adjustmentIds.size !== selectedAdjustmentIds.length ||
      statementLineIds.size !== selectedStatementLineIds.length) {
    return false;
  }

  const receiptsById = new Map(dataset.receipts.map((receipt) => [receipt.id, receipt]));
  const adjustmentsById = new Map(dataset.adjustments.map((adjustment) => [adjustment.id, adjustment]));
  const statementLinesById = new Map(dataset.statementLines.map((line) => [line.id, line]));
  const selectedReceipts = selectedReceiptIds.map((id) => receiptsById.get(id));
  const selectedAdjustments = selectedAdjustmentIds.map((id) => adjustmentsById.get(id));
  const selectedLines = selectedStatementLineIds.map((id) => statementLinesById.get(id));

  if (
    selectedReceipts.some((receipt) => !receipt || receipt.status !== 'Pendente') ||
    selectedAdjustments.some((adjustment) => !adjustment || adjustment.status !== 'Pendente') ||
    selectedLines.some((line) => !line || line.status !== 'Pendente')
  ) {
    return false;
  }

  const linkedReceiptIds = new Set(selectedLines.map((line) => (line as BankStatementLine).receiptId));
  if (linkedReceiptIds.size !== receiptIds.size || [...receiptIds].some((id) => !linkedReceiptIds.has(id))) {
    return false;
  }
  const linkedAdjustmentIds = new Set(selectedLines.flatMap((line) =>
    (line as BankStatementLine).adjustmentId ? [(line as BankStatementLine).adjustmentId!] : [],
  ));
  if (linkedAdjustmentIds.size !== adjustmentIds.size ||
      [...adjustmentIds].some((id) => !linkedAdjustmentIds.has(id))) {
    return false;
  }

  const totals = calculateConciliationSelectionTotals(
    selectedReceiptIds,
    selectedStatementLineIds,
    dataset.receipts,
    dataset.statementLines,
    selectedAdjustmentIds,
    dataset.adjustments,
  );

  return totals.differenceCents === 0;
}

function sumAmounts(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}

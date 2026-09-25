import {
  basisPointsToPercent,
  calculateConciliationSelectionTotals,
  calculateDifference,
  calculateFeeAmountCents,
  calculateNetAmountCents,
  calculateTotals,
  canReconcileSelection,
  filterSales,
  getNextCalendarDate,
  getRateBasisPointsForService,
  getStatementDescription,
  groupReconciliationEntries,
  groupSales,
} from './demo-calculations';
import { DEMO_INITIAL_DATA } from './demo-data';
import type { PaymentBrand, SaleService } from './demo-data.models';

describe('demo data and financial calculations', () => {
  it('uses the configured rate for each service and rounds fees to cents', () => {
    expect(getRateBasisPointsForService('Débito')).toBe(75);
    expect(getRateBasisPointsForService('Crédito')).toBe(110);
    expect(getRateBasisPointsForService('Voucher')).toBe(360);
    expect(basisPointsToPercent(75)).toBe(0.75);
    expect(calculateFeeAmountCents(10_000, 75)).toBe(75);
    expect(calculateFeeAmountCents(10_000, 110)).toBe(110);
    expect(calculateFeeAmountCents(10_000, 360)).toBe(360);
    expect(calculateFeeAmountCents(200, 75)).toBe(2);
  });

  it('calculates net amounts from integer cents', () => {
    expect(calculateNetAmountCents(10_000, 110)).toBe(9_890);
    expect(() => calculateNetAmountCents(100, 101)).toThrow(RangeError);
  });

  it('advances receipt dates by one calendar day, including month boundaries', () => {
    expect(getNextCalendarDate('2026-08-10')).toBe('2026-08-11');
    expect(getNextCalendarDate('2026-08-31')).toBe('2026-09-01');
    expect(() => getNextCalendarDate('2026-02-30')).toThrow(RangeError);
  });

  it('keeps the fixed August seed within the daily and transaction limits', () => {
    const salesPerDay = new Map<string, number>();
    const seenBrands = new Set<PaymentBrand>();
    const allowedServices: Record<PaymentBrand, readonly SaleService[]> = {
      'Visa Electron': ['Débito'],
      'Visa Crédito': ['Crédito'],
      Mastercard: ['Crédito', 'Débito'],
      Elo: ['Crédito', 'Débito'],
      Alelo: ['Voucher'],
      'VR Benefícios': ['Voucher'],
      Ticket: ['Voucher'],
    };

    for (const sale of DEMO_INITIAL_DATA.sales) {
      salesPerDay.set(sale.saleDate, (salesPerDay.get(sale.saleDate) ?? 0) + 1);
      seenBrands.add(sale.brand);
      expect(sale.grossAmountCents).toBeGreaterThan(99);
      expect(sale.grossAmountCents).toBeLessThan(10_100);
      expect(sale.acquirer).toBe('Cielo');
      expect(sale.financing).toBe('A Vista');
      expect(sale.status).toBe('Confirmado');
      expect(allowedServices[sale.brand]).toContain(sale.service);
    }

    expect(DEMO_INITIAL_DATA.sales).toHaveLength(289);
    expect(salesPerDay.size).toBe(31);
    const dailyCounts = [...salesPerDay.values()];
    expect(Math.max(...dailyCounts)).toBe(15);
    expect(Math.min(...dailyCounts)).toBe(4);
    expect(new Set(dailyCounts).size).toBeGreaterThan(1);
    for (const expectedCount of [8, 10, 12, 15]) {
      expect(dailyCounts).toContain(expectedCount);
    }
    expect(seenBrands.size).toBe(7);
    expect(DEMO_INITIAL_DATA.companies).toHaveLength(4);
    expect(DEMO_INITIAL_DATA.companies[0]).toMatchObject({
      cnpj: '10723113000179',
      legalName: 'CONCILIADOR DEMONSTRAÇÃO',
      isHeadquarters: true,
      isCurrentCompany: true,
    });
    expect(DEMO_INITIAL_DATA.companies.slice(1).every((company) => company.cnpj.startsWith('DEMO-'))).toBe(true);
  });

  it('derives totals and groups from the same sales, fees, receipts, and statement lines', () => {
    const data = DEMO_INITIAL_DATA;
    const totals = calculateTotals(data);
    const expectedGross = data.sales.reduce((sum, sale) => sum + sale.grossAmountCents, 0);
    const expectedFees = data.fees.reduce((sum, fee) => sum + fee.amountCents, 0);
    const expectedReceipts = data.receipts.reduce((sum, receipt) => sum + receipt.amountCents, 0);
    const expectedStatement = data.statementLines.reduce((sum, line) => sum + line.amountCents, 0);

    expect(totals.saleCount).toBe(data.sales.length);
    expect(totals.grossAmountCents).toBe(expectedGross);
    expect(totals.feeAmountCents).toBe(expectedFees);
    expect(totals.netAmountCents).toBe(expectedGross - expectedFees);
    expect(totals.receivedAmountCents).toBe(expectedReceipts);
    expect(totals.statementAmountCents).toBe(expectedStatement);
    expect(expectedReceipts).toBe(expectedGross - expectedFees);
    expect(expectedStatement).toBe(expectedReceipts);

    const groupedTotals = groupSales(data).reduce(
      (sum, group) => sum + group.totals.grossAmountCents,
      0,
    );
    expect(groupedTotals).toBe(totals.grossAmountCents);
  });

  it('links every fee, D+1 receipt, and bank entry to its originating sale', () => {
    const feesBySaleId = new Map(DEMO_INITIAL_DATA.fees.map((fee) => [fee.saleId, fee]));
    const receiptsBySaleId = new Map(DEMO_INITIAL_DATA.receipts.map((receipt) => [receipt.saleId, receipt]));
    const linesByReceiptId = new Map(DEMO_INITIAL_DATA.statementLines.map((line) => [line.receiptId, line]));

    for (const sale of DEMO_INITIAL_DATA.sales) {
      const fee = feesBySaleId.get(sale.id);
      const receipt = receiptsBySaleId.get(sale.id);
      expect(fee).toBeDefined();
      expect(receipt).toBeDefined();
      if (!fee || !receipt) {
        throw new Error(`Relação financeira incompleta para ${sale.id}.`);
      }

      const line = linesByReceiptId.get(receipt.id);
      expect(fee.amountCents).toBe(calculateFeeAmountCents(sale.grossAmountCents, fee.practicedRateBasisPoints));
      expect(fee.netAmountCents).toBe(sale.grossAmountCents - fee.amountCents);
      expect(receipt.feeId).toBe(fee.id);
      expect(receipt.receivedDate).toBe(getNextCalendarDate(sale.saleDate));
      expect(receipt.amountCents).toBe(fee.netAmountCents);
      expect(receipt.status).toBe('Pendente');
      expect(line).toBeDefined();
      expect(line?.amountCents).toBe(receipt.amountCents);
      expect(line?.transactionDate).toBe(receipt.receivedDate);
      expect(line?.status).toBe('Pendente');
      expect(Math.abs(fee.contractRateBasisPoints - fee.practicedRateBasisPoints)).toBeLessThanOrEqual(2);
    }
  });

  it('labels Mastercard and Elo bank payments by credit or debit in the source and consolidated view', () => {
    const expectedCases = [
      { brand: 'Mastercard', service: 'Crédito', description: 'TED CIELO - Mastercard Crédito' },
      { brand: 'Mastercard', service: 'Débito', description: 'TED CIELO - Mastercard Débito' },
      { brand: 'Elo', service: 'Crédito', description: 'TED CIELO - Elo Crédito' },
      { brand: 'Elo', service: 'Débito', description: 'TED CIELO - Elo Débito' },
    ] as const;

    for (const expected of expectedCases) {
      const sale = DEMO_INITIAL_DATA.sales.find(
        (item) => item.brand === expected.brand && item.service === expected.service,
      );
      expect(sale).toBeDefined();
      if (!sale) continue;
      expect(getStatementDescription(sale)).toBe(expected.description);

      const receipt = DEMO_INITIAL_DATA.receipts.find((item) => item.saleId === sale.id)!;
      const line = DEMO_INITIAL_DATA.statementLines.find((item) => item.receiptId === receipt.id)!;
      expect(line.description).toBe(expected.description);

      const group = groupReconciliationEntries(DEMO_INITIAL_DATA, line.accountId, line.transactionDate)
        .find((item) => item.brand === sale.brand && item.service === sale.service);
      expect(group?.description).toBe(expected.description);
    }
  });

  it('combines date, acquirer, brand, and service filters over the source sales', () => {
    const lastDaySale = DEMO_INITIAL_DATA.sales.find((sale) => sale.saleDate === '2026-08-31');
    if (!lastDaySale) {
      throw new Error('A massa deve incluir vendas em 31/08/2026.');
    }

    const filtered = filterSales(DEMO_INITIAL_DATA, {
      dateBasis: 'receipt',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      acquirer: 'Cielo',
      brand: lastDaySale.brand,
      service: lastDaySale.service,
    });

    expect(filtered).toEqual([lastDaySale]);
    expect(filterSales(DEMO_INITIAL_DATA, { endDate: '2026-08-31', dateBasis: 'receipt' })).toHaveLength(
      DEMO_INITIAL_DATA.sales.filter((sale) => sale.saleDate < '2026-08-31').length,
    );
  });

  it('computes the reconciliation difference and only accepts matched pending pairs', () => {
    const data = DEMO_INITIAL_DATA;
    const receipt = data.receipts[0];
    const matchingLine = data.statementLines.find((line) => line.receiptId === receipt.id);
    const unrelatedLine = data.statementLines.find((line) => line.receiptId !== receipt.id);
    if (!receipt || !matchingLine || !unrelatedLine) {
      throw new Error('A massa deve conter recebimentos e lançamentos de extrato.');
    }

    expect(calculateDifference(1_500, 1_200)).toBe(300);
    expect(calculateDifference(1_200, 1_500)).toBe(-300);
    expect(
      calculateConciliationSelectionTotals(
        [receipt.id],
        [matchingLine.id],
        data.receipts,
        data.statementLines,
      ),
    ).toMatchObject({
      statementAmountCents: receipt.amountCents,
      receiptAmountCents: receipt.amountCents,
      differenceCents: 0,
      receiptCount: 1,
      statementLineCount: 1,
    });
    expect(canReconcileSelection([receipt.id], [matchingLine.id], data)).toBe(true);
    expect(canReconcileSelection([], [], data)).toBe(false);
    expect(canReconcileSelection([receipt.id], [unrelatedLine.id], data)).toBe(false);
  });
});

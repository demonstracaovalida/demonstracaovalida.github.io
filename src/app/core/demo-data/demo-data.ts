import { calculateFeeAmountCents, getContractRateBasisPointsForService, getNextCalendarDate, getStatementDescription } from './demo-calculations';
import {
  type BankStatementLine,
  type CompanyBranch,
  type DemoBankAccount,
  type DemoDataset,
  type DemoSale,
  type IsoDate,
  type PaymentBrand,
  type PaymentReceipt,
  type SaleFee,
  type SaleService,
} from './demo-data.models';

// Fixed August 2026 sales amounts in cents. Daily row lengths encode the
// persisted transaction count for each date (between four and fifteen sales).
const DAILY_GROSS_AMOUNT_CENTS: readonly (readonly number[])[] = [
  [2140, 3875, 5620, 8295, 4730, 4471, 6423, 8375, 1327, 3279, 5231, 7183],
  [3599, 9210, 2485, 6075, 7830, 7547, 9572, 2597],
  [5200, 3185, 9999, 4410, 2755],
  [6850, 1935, 7275, 3645, 8790, 4699, 6870],
  [4325, 7490, 2160, 5865, 9675, 7775, 1019, 3263, 5507],
  [2975, 8180, 4550, 6325, 3485, 1851],
  [9010, 2830, 5175, 7640, 3925, 4927, 7317, 9707, 3097, 5487, 7877, 1267],
  [5745, 3360, 8875, 4290, 6515, 8003, 1466, 3929, 6392, 8855, 2318, 4781, 7244, 9707, 3170],
  [2465, 7950, 3840, 9285, 5630, 2079, 4615, 7151, 9687],
  [7185, 2540, 4965, 8390],
  [4630, 9820, 3155, 6780, 5210, 8231, 1913, 4595],
  [8955, 3725, 6480, 2390, 7545, 2307, 5062, 7817, 1572, 4327],
  [3365, 6110, 8475, 2855, 9340, 5383, 8211],
  [7810, 4295, 5645, 3170, 6995, 8459, 2360, 5261, 8162, 2063, 4964, 7865, 1766],
  [2580, 8645, 4015, 7390, 5285, 2535, 5509, 8483, 2457, 5431, 8405, 2379, 5353, 8327, 2301],
  [6275, 3490, 9175, 4760, 2850, 5611, 8658, 2705, 5752, 8799],
  [5435, 7985, 3225, 6690, 4350],
  [9360, 2745, 5810, 8235, 3675, 2763, 5956, 9149, 3342],
  [4155, 6875, 9530, 3280, 7425, 5839, 9105, 3371, 6637, 9903, 4169],
  [8620, 2315, 5970, 4865, 7795, 8915],
  [3890, 7245, 4580, 8915, 2630, 2991, 6403, 9815, 4227, 7639, 2051, 5463, 8875, 3287],
  [6490, 3055, 8375, 4920, 7165, 6067, 9552, 4037, 7522, 2007, 5492, 8977, 3462, 6947, 1432],
  [2765, 9410, 3575, 6840, 5295, 9143, 3701, 7259],
  [7585, 4130, 8625, 2945],
  [5085, 7930, 3420, 9165, 4655, 6295, 9999],
  [3215, 6745, 8890, 2545, 7380, 9371, 4148, 7925, 2702, 6479],
  [8245, 4860, 2955, 7615, 5390, 3447, 7297, 2147],
  [4475, 9255, 3620, 6165, 2835, 6523, 1446, 5369, 9292, 4215, 8138, 3061, 6984],
  [6955, 3375, 8520, 4715, 7290, 9599, 4595, 8591, 3587, 7583, 2579, 6575, 1571, 5567, 9563],
  [2475, 7835, 5240, 9685, 4195, 3675, 7744, 2813, 6882],
  [5715, 3190, 8465, 4325, 7580],
];

const BRANDS: readonly PaymentBrand[] = [
  'Visa Electron',
  'Visa Crédito',
  'Mastercard',
  'Elo',
  'Alelo',
  'VR Benefícios',
  'Ticket',
];

const COMPANY_ID = 'empresa-principal';
const DEMO_BANK_ACCOUNTS: readonly DemoBankAccount[] = [
  {
    id: 'conta-bradesco-demo',
    bankName: 'Bradesco (237)',
    agency: '321',
    accountNumber: '98765-3',
    lastStatementDate: '2026-07-30',
    status: 'Pendente',
  },
];

const DEMO_COMPANIES: readonly CompanyBranch[] = [
  {
    id: COMPANY_ID,
    cnpj: '10723113000179',
    legalName: 'CONCILIADOR DEMONSTRAÇÃO',
    tradeName: 'CONCILIADOR DEMONSTRAÇÃO',
    isHeadquarters: true,
    isCurrentCompany: true,
  },
  {
    id: 'filial-1',
    cnpj: 'DEMO-FILIAL-001',
    legalName: 'Filial 1',
    tradeName: 'Filial 1',
    isHeadquarters: false,
    isCurrentCompany: false,
  },
  {
    id: 'filial-2',
    cnpj: 'DEMO-FILIAL-002',
    legalName: 'Filial 2',
    tradeName: 'Filial 2',
    isHeadquarters: false,
    isCurrentCompany: false,
  },
  {
    id: 'filial-3',
    cnpj: 'DEMO-FILIAL-003',
    legalName: 'Filial 3',
    tradeName: 'Filial 3',
    isHeadquarters: false,
    isCurrentCompany: false,
  },
];

function getService(brand: PaymentBrand, saleOrdinal: number): SaleService {
  switch (brand) {
    case 'Visa Electron':
      return 'Débito';
    case 'Visa Crédito':
      return 'Crédito';
    case 'Mastercard':
    case 'Elo':
      return saleOrdinal % 2 === 0 ? 'Crédito' : 'Débito';
    case 'Alelo':
    case 'VR Benefícios':
    case 'Ticket':
      return 'Voucher';
  }
}

function createSales(): DemoSale[] {
  const sales: DemoSale[] = [];
  let saleOrdinal = 0;

  DAILY_GROSS_AMOUNT_CENTS.forEach((amountsForDay, dayIndex) => {
    const day = dayIndex + 1;
    const saleDate = `2026-08-${String(day).padStart(2, '0')}` as IsoDate;

    amountsForDay.forEach((grossAmountCents, positionInDay) => {
      const brand = BRANDS[(dayIndex + positionInDay) % BRANDS.length];
      const saleNumber = saleOrdinal + 1;
      const saleId = `venda-${saleDate.replaceAll('-', '')}-${String(positionInDay + 1).padStart(2, '0')}`;

      sales.push({
        id: saleId,
        companyId: COMPANY_ID,
        acquirer: 'Cielo',
        brand,
        service: getService(brand, saleOrdinal),
        financing: 'A Vista',
        saleDate,
        grossAmountCents,
        installmentCount: 1,
        installmentNumber: 1,
        nsu: String(860000000 + saleNumber),
        authorizationCode: String(260000 + saleNumber),
        status: 'Confirmado',
      });

      saleOrdinal += 1;
    });
  });

  return sales;
}

function createFees(sales: readonly DemoSale[]): SaleFee[] {
  const practicedOffsets = [-1, 1, 2, 3] as const;
  const practicedRates = new Map<string, number>();

  return sales.map((sale) => {
    const contractRateBasisPoints = getContractRateBasisPointsForService(sale.service);
    const configurationKey = [sale.acquirer, sale.brand, sale.service, sale.financing].join('|');
    let practicedRateBasisPoints = practicedRates.get(configurationKey);
    if (practicedRateBasisPoints === undefined) {
      practicedRateBasisPoints = sale.brand === 'Ticket'
        ? 625
        : contractRateBasisPoints + practicedOffsets[practicedRates.size % practicedOffsets.length];
      practicedRates.set(configurationKey, practicedRateBasisPoints);
    }
    const amountCents = calculateFeeAmountCents(sale.grossAmountCents, practicedRateBasisPoints);

    return {
      id: `taxa-${sale.id}`,
      saleId: sale.id,
      practicedRateBasisPoints,
      contractRateBasisPoints,
      amountCents,
      netAmountCents: sale.grossAmountCents - amountCents,
    };
  });
}

function createReceipts(sales: readonly DemoSale[], fees: readonly SaleFee[]): PaymentReceipt[] {
  const feeBySaleId = new Map(fees.map((fee) => [fee.saleId, fee]));

  return sales.map((sale) => {
    const fee = feeBySaleId.get(sale.id);
    if (!fee) {
      throw new Error(`Taxa ausente para a venda ${sale.id}.`);
    }

    return {
      id: `recebimento-${sale.id}`,
      saleId: sale.id,
      feeId: fee.id,
      receivedDate: getNextCalendarDate(sale.saleDate),
      amountCents: fee.netAmountCents,
      status: 'Pendente',
    };
  });
}

function createStatementLines(
  sales: readonly DemoSale[],
  receipts: readonly PaymentReceipt[],
): BankStatementLine[] {
  const saleById = new Map(sales.map((sale) => [sale.id, sale]));

  return receipts.map((receipt) => {
    const sale = saleById.get(receipt.saleId);
    if (!sale) {
      throw new Error(`Venda ausente para o recebimento ${receipt.id}.`);
    }

    return {
      id: `extrato-${receipt.id}`,
      bankName: DEMO_BANK_ACCOUNTS[0].bankName,
      accountId: DEMO_BANK_ACCOUNTS[0].id,
      receiptId: receipt.id,
      transactionDate: receipt.receivedDate,
      description: getStatementDescription(sale),
      amountCents: receipt.amountCents,
      status: 'Pendente',
    };
  });
}

function createInitialData(): DemoDataset {
  const sales = createSales();
  const fees = createFees(sales);
  const receipts = createReceipts(sales, fees);
  const statementLines = createStatementLines(sales, receipts);

  return {
    companies: DEMO_COMPANIES,
    bankAccounts: DEMO_BANK_ACCOUNTS,
    sales,
    fees,
    receipts,
    statementLines,
    conciliations: [],
  };
}

/** Immutable source data; each in-memory store clones it for its own session. */
export const DEMO_INITIAL_DATA = createInitialData();

export type IsoDate = `${number}-${number}-${number}`;

export type PaymentBrand =
  | 'Visa Electron'
  | 'Visa Crédito'
  | 'Mastercard'
  | 'Elo'
  | 'Alelo'
  | 'VR Benefícios'
  | 'Ticket';

export type SaleService = 'Crédito' | 'Débito' | 'Voucher';
export type FinancingType = 'A Vista';
export type ReceiptStatus = 'Pendente' | 'Conciliado';
export type StatementStatus = 'Pendente' | 'Conciliado';
export type ReportType = 'sales' | 'fees' | 'monthly';
export type DetailLevel = 'summary' | 'detail';
export type FilterDateBasis = 'sale' | 'receipt';

export interface CompanyBranch {
  readonly id: string;
  readonly cnpj: string;
  readonly legalName: string;
  readonly tradeName: string;
  readonly isHeadquarters: boolean;
  readonly isCurrentCompany: boolean;
}

export interface DemoBankAccount {
  readonly id: string;
  readonly bankName: string;
  readonly agency: string;
  readonly accountNumber: string;
  readonly lastStatementDate: IsoDate;
  readonly status: 'Pendente';
}

export interface DemoSale {
  readonly id: string;
  readonly companyId: string;
  readonly acquirer: string;
  readonly brand: PaymentBrand;
  readonly service: SaleService;
  readonly financing: FinancingType;
  readonly saleDate: IsoDate;
  readonly grossAmountCents: number;
  readonly installmentCount: 1;
  readonly installmentNumber: 1;
  readonly nsu: string;
  readonly authorizationCode: string;
  readonly status: 'Confirmado';
}

export interface SaleFee {
  readonly id: string;
  readonly saleId: string;
  /** Rate charged in basis points: 75 means 0.75%; fixed per fee configuration. */
  readonly practicedRateBasisPoints: number;
  /** Contractual service rate, using the same basis point unit. */
  readonly contractRateBasisPoints: number;
  readonly amountCents: number;
  readonly netAmountCents: number;
}

export interface PaymentReceipt {
  readonly id: string;
  readonly saleId: string;
  readonly feeId: string;
  readonly receivedDate: IsoDate;
  readonly amountCents: number;
  readonly status: ReceiptStatus;
}

export interface BankStatementLine {
  readonly id: string;
  readonly bankName: string;
  readonly accountId: string;
  readonly receiptId: string;
  readonly transactionDate: IsoDate;
  readonly description: string;
  readonly amountCents: number;
  readonly status: StatementStatus;
}

export interface ConciliationRecord {
  readonly id: string;
  readonly receiptIds: readonly string[];
  readonly statementLineIds: readonly string[];
  readonly amountCents: number;
  readonly reconciledAt: string;
}

export interface DemoDataset {
  readonly companies: readonly CompanyBranch[];
  readonly bankAccounts: readonly DemoBankAccount[];
  readonly sales: readonly DemoSale[];
  readonly fees: readonly SaleFee[];
  readonly receipts: readonly PaymentReceipt[];
  readonly statementLines: readonly BankStatementLine[];
  readonly conciliations: readonly ConciliationRecord[];
}

export interface DemoFilters {
  readonly reportType?: ReportType;
  readonly detailLevel?: DetailLevel;
  readonly startDate?: IsoDate;
  readonly endDate?: IsoDate;
  readonly dateBasis?: FilterDateBasis;
  readonly acquirer?: string;
  readonly brand?: PaymentBrand;
  readonly service?: SaleService;
}

export interface DemoTotals {
  readonly saleCount: number;
  readonly grossAmountCents: number;
  readonly feeAmountCents: number;
  readonly netAmountCents: number;
  readonly receivedAmountCents: number;
  readonly statementAmountCents: number;
}

export interface SaleGroup {
  readonly key: string;
  readonly acquirer: string;
  readonly brand: PaymentBrand;
  readonly service: SaleService;
  readonly financing: FinancingType;
  readonly saleIds: readonly string[];
  readonly totals: DemoTotals;
}

/** One payment shown in manual reconciliation, backed by all its sales. */
export interface ReconciliationGroup {
  readonly key: string;
  readonly acquirer: string;
  readonly brand: PaymentBrand;
  readonly service: SaleService;
  readonly financing: FinancingType;
  readonly saleDate: IsoDate;
  readonly receivedDate: IsoDate;
  readonly description: string;
  readonly receiptIds: readonly string[];
  readonly statementLineIds: readonly string[];
  readonly installmentCount: number;
  readonly amountCents: number;
}

export interface ConciliationSelectionTotals {
  readonly statementAmountCents: number;
  readonly receiptAmountCents: number;
  readonly differenceCents: number;
  readonly statementLineCount: number;
  readonly receiptCount: number;
}

/** Every DemoStateService instance owns an independent copy of this state. */
export interface DemoSessionState {
  readonly data: DemoDataset;
  readonly selectedBankAccountId: string | null;
  readonly selectedStatementDate: IsoDate | null;
  readonly selectedReceiptIds: readonly string[];
  readonly selectedStatementLineIds: readonly string[];
}

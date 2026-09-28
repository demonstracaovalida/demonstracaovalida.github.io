export type TutorialStepKind = 'informativa' | 'interativa' | 'navegacao';

export const TUTORIAL_MANUAL_DATE = '2026-08-02' as const;

export interface TutorialStep {
  readonly kind: TutorialStepKind;
  readonly route: string;
  readonly targets: readonly string[];
  readonly text: string;
  readonly next?: string;
  readonly action?: string;
  readonly destination?: string;
  readonly optionalWhenMissing?: boolean;
  readonly extraBottom?: number;
  readonly extraRight?: number;
}

/** The tutorial points at existing controls; it never owns their data or actions. */
export const TUTORIAL_STEPS: Readonly<Record<string, TutorialStep>> = {
  'home-cards': {
    kind: 'informativa', route: '/', targets: ['home-cards'],
    text: 'Estes indicadores resumem vendas, recebimentos e taxas da demonstração.', next: 'home-chart',
  },
  'home-chart': {
    kind: 'informativa', route: '/', targets: ['home-chart'],
    text: 'O gráfico mostra as vendas por dia em agosto de 2026.', next: 'home-report-type',
  },
  'home-report-type': {
    kind: 'interativa', route: '/', targets: ['home-report-type'], action: 'home-report-type',
    text: 'Selecione Relatório de Vendas. Os demais relatórios serão liberados nas próximas etapas do tutorial.', next: 'home-filters',
  },
  'home-filters': {
    kind: 'informativa', route: '/', targets: ['home-filters'],
    text: 'Você pode ajustar detalhamento, adquirente e bandeira. Essas escolhas filtram o relatório gerado.', next: 'home-dates',
  },
  'home-dates': {
    kind: 'informativa', route: '/', targets: ['home-start-date', 'home-end-date'],
    text: 'As datas já estão preenchidas de 01/08/2026 a 31/08/2026. Mantenha o período para gerar agosto inteiro ou altere-o. Avance para Gerar.', next: 'home-generate',
  },
  'home-generate': {
    kind: 'interativa', route: '/', targets: ['home-start-date', 'home-end-date', 'home-generate'], action: 'home-generate',
    text: 'Clique em Gerar para abrir o relatório escolhido com os seus filtros.', next: 'report-wait',
  },
  'home-select-sales': {
    kind: 'interativa', route: '/', targets: ['home-report-type'], action: 'home-report-type',
    text: 'Agora selecione Relatório de Vendas para conhecer as vendas da demonstração.', next: 'home-generate-sales',
  },
  'home-select-fees': {
    kind: 'interativa', route: '/', targets: ['home-report-type'], action: 'home-report-type',
    text: 'Agora selecione Taxas Administrativas para conferir as taxas cobradas.', next: 'home-full-month-fees',
  },
  'home-select-monthly': {
    kind: 'interativa', route: '/', targets: ['home-report-type'], action: 'home-report-type',
    text: 'Agora selecione Resultado Mensal para conhecer o consolidado.', next: 'home-full-month-monthly',
  },
  'home-full-month-fees': {
    kind: 'informativa', route: '/', targets: ['home-filters'],
    text: 'Para Taxas Administrativas, use todo o mês de agosto: Data Inicial 01/08/2026 e Data Final 31/08/2026. Deixe Bandeira em Todas ou Ticket para ver o exemplo da Ticket.',
    next: 'home-generate-full-month',
  },
  'home-full-month-monthly': {
    kind: 'informativa', route: '/', targets: ['home-start-date', 'home-end-date'],
    text: 'Para Resultado Mensal, use todo o mês de agosto: Data Inicial 01/08/2026 e Data Final 31/08/2026. Ajuste os campos, se necessário.',
    next: 'home-generate-full-month',
  },
  'home-generate-sales': {
    kind: 'interativa', route: '/', targets: ['home-start-date', 'home-end-date', 'home-generate'], action: 'home-generate',
    text: 'Clique em Gerar para abrir o Relatório de Vendas com os filtros escolhidos.', next: 'report-wait',
  },
  'home-generate-full-month': {
    kind: 'interativa', route: '/', targets: ['home-filters'], action: 'home-generate',
    text: 'Com o período completo de 01/08/2026 a 31/08/2026, clique em Gerar. Adquirente e bandeira podem continuar filtrados.',
    next: 'report-wait',
  },
  'report-wait': {
    kind: 'navegacao', route: '/', targets: ['home-chart'],
    text: 'Explore o relatório na nova aba. Ao concluir, volte aqui para continuar a visita.',
  },
  'sales-overview': {
    kind: 'informativa', route: '/relatorio-vendas', targets: ['sales-table'],
    text: 'As vendas aparecem agrupadas por dia, bandeira e serviço conforme os filtros escolhidos.', next: 'sales-total',
  },
  'sales-total': {
    kind: 'informativa', route: '/relatorio-vendas', targets: ['sales-total'],
    text: 'O Total Geral soma as vendas exibidas neste relatório.', next: 'sales-expand',
  },
  'sales-expand': {
    kind: 'interativa', route: '/relatorio-vendas', targets: ['sales-expand'],
    action: 'sales-expand', optionalWhenMissing: true,
    text: 'Clique no controle de um grupo para abrir ou recolher o detalhamento das vendas reais.', next: 'sales-details',
  },
  'sales-details': {
    kind: 'informativa', route: '/relatorio-vendas', targets: ['sales-details'],
    optionalWhenMissing: true,
    text: 'Aqui estão as vendas, taxas, datas de depósito e situações de recebimento do grupo.', next: 'report-return',
  },
  'fees-overview': {
    kind: 'informativa', route: '/relatorio-taxas', targets: ['fees-table'],
    text: 'Após a conciliação bancária, o relatório Taxas Administrativas compara a taxa contratual prevista com a taxa praticada, calculada internamente com base nos extratos EDI.', next: 'fees-groups',
  },
  'fees-groups': {
    kind: 'informativa', route: '/relatorio-taxas', targets: ['fees-rate'],
    optionalWhenMissing: true,
    text: 'Compare as taxas por adquirente e bandeira para verificar se a cobrança cumpre o que foi combinado em contrato.', next: 'fees-ticket',
  },
  'fees-ticket': {
    kind: 'informativa', route: '/relatorio-taxas', targets: ['fees-ticket'],
    optionalWhenMissing: true,
    text: 'Cuidado: ao analisar a Ticket, note que a taxa praticada de 6,25% está maior do que a combinada em contrato, de 3,60%.', next: 'report-return',
  },
  'monthly-overview': {
    kind: 'informativa', route: '/resultado-mensal', targets: ['monthly-table'],
    text: 'Após a conciliação bancária, Resultado Mensal reúne o total vendido, o total recebido e a taxa cobrada em percentual e em valor monetário (R$).', next: 'monthly-total',
  },
  'monthly-total': {
    kind: 'informativa', route: '/resultado-mensal', targets: ['monthly-total'],
    text: 'O quadro consolida bruto, líquido e taxas descontadas em reais. A coluna Baixado acompanha a conciliação dos recebimentos.', next: 'report-return',
  },
  'report-return': {
    kind: 'informativa', route: '*', targets: ['report-heading'],
    text: 'Volte à aba principal para continuar a visita pelos relatórios e demais telas. Este relatório permanece disponível nesta aba.',
  },
  'branches-navigation': {
    kind: 'navegacao', route: '/', targets: ['nav-branches'], destination: '/filiais',
    text: 'Volte à aba principal e clique em Filiais na barra superior.', next: 'branches-list',
  },
  'branches-list': {
    kind: 'informativa', route: '/filiais', targets: ['branches-list'],
    text: 'Esta lista mostra a empresa principal e as filiais fictícias da demonstração.', next: 'branches-current',
  },
  'branches-current': {
    kind: 'informativa', route: '/filiais', targets: ['branches-current'],
    text: 'A empresa atualmente aberta aparece em vermelho.', next: 'manual-navigation',
  },
  'manual-navigation': {
    kind: 'navegacao', route: '/filiais', targets: ['nav-conciliation'],
    destination: '/nova-conciliacao', extraBottom: 44, extraRight: 60,
    text: 'Passe o mouse em Conciliação e clique em Nova Conciliação no menu.', next: 'manual-intro',
  },
  'manual-intro': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-intro'],
    text: 'Este fluxo vincula lançamentos bancários aos recebimentos da demonstração.', next: 'manual-start',
  },
  'manual-start': {
    kind: 'interativa', route: '/nova-conciliacao', targets: ['manual-start'], action: 'manual-start',
    text: 'Clique em Nova Conciliação Manual para escolher a conta bancária.', next: 'manual-banks',
  },
  'manual-banks': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-bank-list'],
    text: 'As contas disponíveis estão nesta lista.', next: 'manual-select-bank',
  },
  'manual-select-bank': {
    kind: 'interativa', route: '/nova-conciliacao', targets: ['manual-bank-card'], action: 'manual-bank',
    text: 'Escolha uma conta real da lista para continuar.', next: 'manual-days',
  },
  'manual-days': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-day-list'],
    text: 'Os extratos disponíveis aparecem por data e situação.', next: 'manual-select-day',
  },
  'manual-select-day': {
    kind: 'interativa', route: '/nova-conciliacao', targets: ['manual-day-0208'], action: 'manual-day',
    text: 'Clique na data 02/08 para abrir a grade de conciliação.', next: 'manual-statement',
  },
  'manual-statement': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-statement'],
    text: 'À esquerda ficam os lançamentos do extrato bancário.', next: 'manual-receipts',
  },
  'manual-receipts': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-receipts'],
    text: 'À direita ficam os recebimentos derivados das vendas, com depósito em D+1.', next: 'manual-adjustments',
  },
  'manual-adjustments': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-adjustment-row'],
    optionalWhenMissing: true,
    text: 'Em 02/08, o aluguel da maquininha aparece como ajuste negativo de R$ 50,00 para Visa Electron.', next: 'manual-statement-total',
  },
  'manual-statement-total': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-statement-total'],
    text: 'Total Extrato soma os lançamentos bancários selecionados.', next: 'manual-counterpart-total',
  },
  'manual-counterpart-total': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-counterpart-total'],
    text: 'Total Contrapartidas considera os recebimentos selecionados menos os cancelamentos, somando os ajustes com seu sinal. O aluguel da maquininha reduz esse total em R$ 50,00 quando selecionado.', next: 'manual-difference',
  },
  'manual-difference': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-difference'],
    text: 'Diferença é Total Extrato menos Total Contrapartidas. Zero indica valores compatíveis.', next: 'manual-select-statement',
  },
  'manual-select-statement': {
    kind: 'interativa', route: '/nova-conciliacao', targets: ['manual-statement'],
    action: 'manual-statement-selection',
    text: 'Marque um lançamento do extrato. A seleção atualiza o Total Extrato.', next: 'manual-select-receipt',
  },
  'manual-select-receipt': {
    kind: 'interativa', route: '/nova-conciliacao', targets: ['manual-receipts'],
    action: 'manual-receipt-selection',
    text: 'Marque o recebimento correspondente. A seleção atualiza o Total Contrapartidas.', next: 'manual-reconcile',
  },
  'manual-select-adjustment': {
    kind: 'interativa', route: '/nova-conciliacao', targets: ['manual-adjustment-row'],
    action: 'manual-adjustment-selection',
    text: 'Marque também o ajuste de aluguel da maquininha para descontar R$ 50,00 das contrapartidas.', next: 'manual-reconcile',
  },
  'manual-reconcile': {
    kind: 'interativa', route: '/nova-conciliacao',
    targets: ['manual-statement', 'manual-receipts', 'manual-totals', 'manual-reconcile'],
    action: 'manual-reconciled',
    text: 'Ajuste as seleções até a Diferença ficar em R$ 0,00. Então clique em Conciliar Selecionados.', next: 'manual-complete',
  },
  'manual-complete': {
    kind: 'informativa', route: '/nova-conciliacao', targets: ['manual-totals'],
    text: 'A conciliação foi aplicada aos dados reais desta sessão. Clique em > para concluir o tutorial e continuar explorando.',
  },
};

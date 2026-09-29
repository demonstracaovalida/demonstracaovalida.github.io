export const FAQ_CATEGORIES = [
  'Funcionamento',
  'Vendas e Recebimentos',
  'Integrações',
  'Implantação',
  'Suporte',
] as const;

export type FaqCategory = typeof FAQ_CATEGORIES[number];

export interface FaqEntry {
  readonly id: number;
  readonly categoria: FaqCategory;
  readonly pergunta: string;
  readonly resposta: string;
}

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    id: 1,
    categoria: 'Funcionamento',
    pergunta: 'O que é a conciliação de cartões?',
    resposta: 'É o processo de comparar as vendas realizadas com os valores que as operadoras de cartão informam que serão pagos ou já foram pagos. Isso permite identificar diferenças entre o que foi vendido, o que deveria ser recebido e o que efetivamente entrou na conta.',
  },
  {
    id: 2,
    categoria: 'Funcionamento',
    pergunta: 'Qual é a vantagem de utilizar o Valida?',
    resposta: 'O Valida centraliza informações de vendas, taxas e recebimentos, facilitando o acompanhamento financeiro e a identificação de divergências. O objetivo é reduzir o trabalho de conferência manual e proporcionar maior controle sobre os recebíveis.',
  },
  {
    id: 3,
    categoria: 'Funcionamento',
    pergunta: 'O Valida substitui meu sistema de gestão (ERP)?',
    resposta: 'Não necessariamente. O Valida é voltado à conciliação financeira e pode complementar o sistema de gestão utilizado pela empresa. A possibilidade de integração deve ser avaliada conforme o ERP.',
  },
  {
    id: 4,
    categoria: 'Funcionamento',
    pergunta: 'O Valida movimenta o dinheiro da minha conta bancária?',
    resposta: 'A conciliação é uma atividade de conferência de informações financeiras. Ela não deve ser confundida com a realização de transferências ou movimentações bancárias. Em suma, não.',
  },
  {
    id: 5,
    categoria: 'Vendas e Recebimentos',
    pergunta: 'O sistema mostra se uma venda foi realmente paga?',
    resposta: 'O Valida permite acompanhar os recebimentos informados pelas operadoras e compará-los com os lançamentos financeiros disponíveis. Assim, é possível identificar pagamentos conciliados e possíveis pendências.',
  },
  {
    id: 6,
    categoria: 'Vendas e Recebimentos',
    pergunta: 'Consigo identificar taxas cobradas pelas operadoras?',
    resposta: 'Sim. O relatório de taxas permite consultar os percentuais praticados e comparar informações financeiras relacionadas às vendas. A comparação com taxas contratadas depende da configuração dessas informações.',
  },
  {
    id: 7,
    categoria: 'Vendas e Recebimentos',
    pergunta: 'Posso consultar vendas e recebimentos de meses anteriores?',
    resposta: 'Sim, desde que os dados históricos correspondentes estejam disponíveis no sistema. A disponibilidade depende do período de informações recebido e processado.',
  },
  {
    id: 8,
    categoria: 'Vendas e Recebimentos',
    pergunta: 'O Valida realiza conciliação bancária?',
    resposta: 'O sistema permite comparar informações de recebimentos com lançamentos bancários disponibilizados para conciliação. A disponibilidade de automação e os formatos de extrato aceitos devem ser confirmados na implantação.',
  },
  {
    id: 14,
    categoria: 'Vendas e Recebimentos',
    pergunta: 'O Valida concilia vendas do tipo convênio?',
    resposta: 'Não. O Valida não concilia vendas do tipo convênio.',
  },
  {
    id: 15,
    categoria: 'Vendas e Recebimentos',
    pergunta: 'Com que frequência devo fazer a conciliação das minhas vendas e recebimentos?',
    resposta: 'Diariamente. A conferência diária ajuda a identificar rapidamente recebimentos pendentes, diferenças nos valores repassados e taxas cobradas acima do contratado, antes que as pendências se acumulem.',
  },
  {
    id: 9,
    categoria: 'Integrações',
    pergunta: 'O sistema funciona com mais de uma operadora de cartão?',
    resposta: 'Sim, desde que as operadoras utilizadas estejam contempladas pelas integrações disponíveis. Isso permite centralizar informações que normalmente seriam consultadas em diferentes portais.',
  },
  {
    id: 10,
    categoria: 'Integrações',
    pergunta: 'Posso acompanhar mais de uma filial ou CNPJ?',
    resposta: 'O Valida possui recursos de organização por estabelecimentos e filiais. A quantidade de empresas atendidas e as condições de contratação devem ser confirmadas comercialmente.',
  },
  {
    id: 11,
    categoria: 'Implantação',
    pergunta: 'Como funciona a implantação?',
    resposta: 'A implantação envolve identificar as operadoras e instituições financeiras utilizadas, configurar as fontes de dados disponíveis e preparar o ambiente para o acompanhamento das informações. As etapas específicas são definidas conforme a operação do cliente.',
  },
  {
    id: 12,
    categoria: 'Implantação',
    pergunta: 'Preciso trocar de banco ou de maquininha para utilizar o Valida?',
    resposta: 'Não.',
  },
  {
    id: 13,
    categoria: 'Suporte',
    pergunta: 'Tenho suporte caso encontre alguma dificuldade?',
    resposta: 'Sim. Suporte via Chat WhatsApp no horário de 8:30 às 17:30.',
  },
];

export function filterFaqEntries(
  entries: readonly FaqEntry[],
  category: FaqCategory | 'Todas',
  search: string,
): readonly FaqEntry[] {
  const normalizedSearch = normalizeFaqText(search.trim());
  return entries.filter((entry) =>
    (category === 'Todas' || entry.categoria === category) &&
    (!normalizedSearch || normalizeFaqText(`${entry.pergunta} ${entry.resposta}`).includes(normalizedSearch)),
  );
}

function normalizeFaqText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

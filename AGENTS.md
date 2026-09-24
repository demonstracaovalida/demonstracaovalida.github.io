# AGENTS.md — Demonstração Valida

## 1. Objetivo do projeto

Construir uma demonstração navegável do sistema Valida em Angular, usando os PNGs em `img/` como especificação visual e os arquivos `instrucao.md` como especificação funcional.

Este NÃO é um redesign do Valida e NÃO é um sistema novo inspirado nele. É uma reprodução visual extremamente fiel das telas fornecidas, alimentada por uma massa de dados fictícia, fixa e coerente.

A aplicação é uma demonstração comercial client-side. Não criar backend, banco de dados, autenticação real ou APIs desnecessárias.

---

# 2. REGRA PRIMORDIAL: OS PRINTS MANDAM

**A interface deve ficar IGUAL aos PNGs de referência.**

Esta regra tem prioridade sobre preferências estéticas, convenções modernas de UI e vontade de "melhorar" a interface.

NÃO:
- modernizar o layout;
- trocar o estilo por Material Design, Bootstrap ou outro design system;
- inventar cards, sombras, bordas arredondadas ou espaçamentos;
- alterar cores porque parecem antigas;
- aumentar/reduzir fontes por preferência;
- reorganizar conteúdo;
- substituir tabelas por componentes modernos;
- criar sidebar;
- simplificar tabelas além do que foi explicitamente pedido;
- inventar elementos não solicitados;
- usar os próprios PNGs como fundo da página para fingir fidelidade.

DEVE:
- implementar a interface em HTML/CSS/Angular real;
- comparar continuamente o resultado renderizado com o PNG;
- reproduzir dimensões, proporções, alinhamentos, cores, bordas, fundos, tipografia, alturas de linha, tabelas, menus, botões, selects, inputs e espaçamentos;
- considerar a resolução/proporção do PNG ao validar a fidelidade;
- preservar o aspecto visual legado do sistema.

Se houver conflito entre "ficaria melhor assim" e o PNG: **o PNG vence**.

Os arquivos `instrucao.md` complementam os PNGs. As correções deste `AGENTS.md` prevalecem sobre instruções antigas conflitantes.

---

# 3. Referências disponíveis

Antes de implementar cada tela, ABRA e ANALISE o PNG correspondente e LEIA o `instrucao.md` da pasta.

Referências:

## Tela inicial
- `img/telainicial/telaincial.png`
- `img/telainicial/instrucao.md`

## Relatório de vendas
- `img/relatorioVendas/statusconciliacaodevendas.png`
- `img/relatorioVendas/detalhamentoVendas.png`
- `img/relatorioVendas/intrucao.md`

`detalhamentoVendas.png` representa o detalhamento aberto ao clicar no `+` de uma linha/grupo do relatório, não uma página visual inventada à parte.

## Resultado mensal
- `img/relatorioMensal/resultadomensal.png`
- `img/relatorioMensal/instrucao.md`

## Ajustes e Taxas
- `img/relatorioTaxas/taxasADM.png`
- `img/relatorioTaxas/instrucao.md`

## Filiais
- `img/filiais/filiais.png`
- `img/filiais/instrucao.md`

## Nova Conciliação
- `img/conciliacaoManual/novaconciliacaoManual1.png`
- `img/conciliacaoManual/selecaobancosManual.png`
- `img/conciliacaoManual/selecaodiasManual.png`
- `img/conciliacaoManual/conciliacaoManual.png`
- `img/conciliacaoManual/instrucao.md`

IMPORTANTE: os quatro PNGs acima NÃO são quatro páginas independentes. São estados sucessivos do MESMO fluxo de **Nova Conciliação**, nesta ordem:

`novaconciliacaoManual1.png`
→ `selecaobancosManual.png`
→ `selecaodiasManual.png`
→ `conciliacaoManual.png`

---

# 4. Dados da empresa de demonstração

Usar como empresa principal:

- Razão/nome exibido: `CONCILIADOR DEMONSTRAÇÃO`
- CNPJ: `10.723.113/0001-79`
- Quando o layout original exibir CNPJ sem máscara: `10723113000179`

NÃO copiar para a demo nomes ou CNPJs reais presentes nos prints.

---

# 5. Período da demonstração

A demonstração deve usar **agosto de 2026**.

Período permitido nos filtros:
- início mínimo: `01/08/2026`
- fim máximo: `31/08/2026`

Qualquer instrução antiga nos arquivos locais mencionando setembro/2026 deve ser considerada substituída por esta regra.

A massa de dados deve ser criada UMA ÚNICA VEZ no código e permanecer determinística. Não gerar uma massa nova quando a aplicação iniciar.

---

# 6. Massa fictícia — fonte única da verdade

Não hardcodar totais independentes em cada tela.

Criar uma massa fictícia central e relacionada. Todas as telas devem derivar seus números dessa mesma massa.

Fluxo conceitual:

`Venda -> Taxa -> Valor líquido -> Recebimento -> Lançamento de extrato -> Conciliação`

Os mesmos dados devem alimentar:
- tela inicial;
- gráfico;
- relatório de vendas;
- detalhamento de vendas;
- relatório de taxas;
- resultado mensal;
- Nova Conciliação.

Se o total de vendas mudar na massa, as telas dependentes devem refletir essa mudança automaticamente.

Preferir valores monetários em centavos inteiros internamente para evitar erros de ponto flutuante. Formatar em BRL apenas na apresentação.

---

# 7. Regras para geração das vendas

Gerar previamente uma massa fixa para agosto/2026.

Limite atualizado:
- **até 15 vendas por dia**.

Não usar `Math.random()` em runtime para reconstruir a massa a cada carregamento. Se um gerador for usado durante o desenvolvimento, usar seed determinística e persistir o resultado final no projeto.

Regras:

### Adquirente
- Cielo

### Bandeiras
- Visa Electron
- Visa Crédito
- Mastercard
- Elo
- Alelo
- VR Benefícios
- Ticket

### Serviço
- Crédito
- Débito
- Voucher

Manter combinações semanticamente plausíveis:
- Visa Electron: Débito
- Visa Crédito: Crédito
- Mastercard/Elo: Crédito ou Débito
- Alelo/VR Benefícios/Ticket: Voucher

### Financiamento
- sempre `A Vista`

### Taxas praticadas
- Débito: `0,75%`
- Crédito: `1,10%`
- Voucher: `3,60%`

### Valor da parcela
- maior que R$ 0,99
- menor que R$ 101,00

### Valor da taxa em reais
`valorTaxa = valorBruto * taxaPercentual`

### Valor líquido
`valorLiquido = valorBruto - valorTaxa`

Aplicar arredondamento monetário consistente em centavos.

### Data de depósito/recebimento
Sempre D+1:
- venda em 10/08/2026 → depósito/recebimento em 11/08/2026.

Para vendas de 31/08, D+1 naturalmente será 01/09/2026, mesmo que o filtro de vendas esteja limitado a agosto.

### Status
- Status Venda: `Confirmado`
- Status Recebimento: `Pendente` antes da conciliação aplicável.

NSU, autorização e demais identificadores podem ser fictícios, porém fixos e determinísticos.

---

# 8. Regra financeira crítica: recebimento e extrato DEVEM bater

Não gerar extrato independentemente.

O lançamento bancário usado na conciliação deve ser DERIVADO do recebimento correspondente.

Para cada contrapartida conciliável:

`valor do extrato === valor do recebimento`

Exemplo:

- bruto: R$ 100,00
- taxa 1,10%: R$ 1,10
- líquido: R$ 98,90
- recebimento: R$ 98,90
- lançamento correspondente no extrato: R$ 98,90

Se a tela trabalhar com recebimento consolidado, o extrato deve corresponder ao total consolidado correto. Nunca criar divergência acidental por arredondamento ou mocks independentes.

Cada entidade relacionada deve possuir IDs/referências internas suficientes para rastrear a origem do valor.

---

# 9. Estado da demonstração e concorrência

Não usar backend compartilhado para o estado da simulação.

Não usar `localStorage`, `sessionStorage`, cookies ou persistência remota para registrar a conciliação.

Cada carregamento/aba deve trabalhar com uma cópia em memória da massa inicial.

Consequências desejadas:
- dois leads acessando ao mesmo tempo NÃO interferem um no outro;
- a conciliação feita pelo Lead A não altera o Lead B;
- recarregar a página restaura naturalmente o estado inicial;
- `Reiniciar Simulação` também restaura explicitamente o estado inicial.

Implementar um serviço/store de estado em memória que faça clone da massa inicial e exponha operações da demo.

Não duplicar lógica de estado dentro de componentes.

---

# 10. Navbar e navegação

A navbar deve seguir visualmente os prints.

REMOVER completamente:
- Cadastros
- Manutenção
- Sair

Manter os demais itens previstos visualmente.

Somente estes fluxos precisam ser clicáveis/navegáveis:
- `Início`
- `Conciliação`
- `Filiais`

Itens meramente visuais não devem levar para páginas inventadas.

## Conciliação

`Conciliação` NÃO deve navegar diretamente para a tela.

Ao passar o mouse sobre `Conciliação`, abrir um submenu/dropdown no estilo visual do sistema contendo:

- `Nova Conciliação`

Ao clicar em `Nova Conciliação`, abrir o estado visual e funcional representado por:

`img/conciliacaoManual/novaconciliacaoManual1.png`

Depois disso, as interações da própria página conduzem aos estados:
1. `novaconciliacaoManual1.png`
2. `selecaobancosManual.png`
3. `selecaodiasManual.png`
4. `conciliacaoManual.png`

Não criar quatro rotas para esses PNGs salvo se houver uma necessidade técnica muito forte. Eles representam estados do mesmo fluxo.

---

# 11. Tela inicial

A URL raiz da aplicação deve abrir diretamente a tela inicial.

Referência:
`img/telainicial/telaincial.png`

Remover da área de abas:
- Último Mês
- Gráficos
- Arquivos Importados

Remover da área de filtros:
- Totaliza por Data
- Tipo Data

`Tipo de Relatório` deve oferecer:
- Relatório de Vendas
- Ajustes e Taxas
- Resultado Mensal

Os filtros visíveis DEVEM funcionar:
- Tipo de Relatório
- Detalhamento, quando aplicável
- Data Inicial
- Data Final
- Adquirente
- Bandeira

Datas limitadas a agosto/2026.

Ao clicar em `Gerar`, abrir/renderizar o relatório selecionado com os filtros informados.

Adquirente e Bandeira devem ser alimentados pela massa/configuração da demo, não por opções desconectadas.

Os três indicadores superiores e o gráfico devem ser calculados a partir da massa fictícia, respeitando o significado visual da tela.

O gráfico deve refletir as vendas fictícias por data. Não desenhar barras arbitrárias só para parecer com o print.

A aparência, densidade, eixos, labels, grid, barras e dimensões do gráfico devem se aproximar ao máximo do PNG. Pode instalar uma biblioteca de gráficos adequada se necessário; não trocar o estilo visual do gráfico.

---

# 12. Relatório de vendas

Referências:
- `statusconciliacaodevendas.png`
- `detalhamentoVendas.png`

A tela deve reproduzir o relatório do print.

Remover a coluna:
- `Não Lançado`

O relatório deve ser gerado com base no dia/período escolhido.

O `Total Vendido` deve ser a soma real das vendas da massa após os filtros.

O botão/ícone `+` deve funcionar:
- fechado: mostra a linha agrupada conforme o print;
- clicado: expande o detalhamento das vendas correspondentes, reproduzindo `detalhamentoVendas.png`;
- permitir recolher novamente se coerente com o controle visual.

O detalhamento deve ser composto pelas vendas reais da massa daquele grupo, não por linhas independentes.

Manter as colunas do detalhamento conforme o print/instrução e as remoções solicitadas.

Status:
- venda: Confirmado
- recebimento: Pendente enquanto não conciliado.

Datas de depósito seguem D+1.

Filtros/botões visíveis que fazem parte do fluxo demonstrado devem funcionar. Não criar exportação PDF/Excel real se isso não for necessário para a demonstração; se os botões precisarem permanecer por fidelidade, podem ser apenas visuais, desde que não aparentem erro ao usuário.

---

# 13. Ajustes e Taxas

Referência:
`img/relatorioTaxas/taxasADM.png`

Reproduzir visualmente o print.

A taxa praticada vem diretamente da regra da venda:
- Débito 0,75%
- Crédito 1,10%
- Voucher 3,60%

A taxa contrato deve ser fixa/determinística para cada linha/grupo da massa e assumir um destes valores em relação à praticada:
- igual;
- praticada - 0,02 ponto percentual;
- praticada + 0,02 ponto percentual.

Exemplos:
- 0,75% → 0,73%, 0,75% ou 0,77%
- 1,10% → 1,08%, 1,10% ou 1,12%

Não usar `Math.random()` a cada renderização. A taxa contrato não pode mudar ao navegar, filtrar ou redesenhar a tela.

Todos os totais devem ser derivados da mesma massa de vendas.

---

# 14. Resultado Mensal

Referência:
`img/relatorioMensal/resultadomensal.png`

Reproduzir visualmente o print.

Regras:
- `Total Vendido`: total bruto real das vendas do agrupamento/mês;
- `Valor Taxa`: valor monetário das taxas, NÃO a porcentagem;
- `Ajustes e Tarifas`: 0;
- `Cancelamentos`: 0;
- `Total Recebido`: total líquido (`bruto - taxas`);
- remover coluna `Dias`.

`Baixado` possui somente os estados relevantes:
- `0%` antes da conciliação manual correspondente;
- `100%` depois que a conciliação manual aplicável for concluída na sessão atual.

A alteração deve acontecer pelo estado compartilhado em memória. Não hardcodar `100%` só para essa tela.

---

# 15. Filiais

Referência:
`img/filiais/filiais.png`

Reproduzir visualmente o print.

Máximo de 4 registros:
- 1 empresa principal;
- até 3 filiais fictícias.

A empresa atualmente aberta deve aparecer em vermelho conforme o comportamento visual do print.

Empresa principal:
- CNPJ `10723113000179`
- `CONCILIADOR DEMONSTRAÇÃO`

Demais CNPJs devem ser fictícios e claramente destinados à demo.
Razão/fantasia das filiais:
- Filial 1
- Filial 2
- Filial 3

Evitar usar CNPJs reais de terceiros. Para registros fictícios adicionais, preferir identificadores explicitamente demonstrativos em vez de copiar dados reais dos screenshots.

---

# 16. Fluxo Nova Conciliação

Referências, na ordem:
1. `novaconciliacaoManual1.png`
2. `selecaobancosManual.png`
3. `selecaodiasManual.png`
4. `conciliacaoManual.png`

Cada interação deve fazer a mesma tela evoluir para o próximo estado visual indicado pelo PNG.

Não pular diretamente para a grade final.

Na grade final (`conciliacaoManual.png`):
- Extrato à esquerda;
- Recebimentos à direita.

## Extrato

Gerar linhas coerentes com os recebimentos fictícios.

Exemplo de descrição:
- `TED ALELO`
- ou descrição equivalente coerente com adquirente/bandeira do recebimento.

Pode descartar:
- Documento
- símbolo laranja mencionado na instrução

quando explicitamente permitido pela instrução e sem quebrar o layout principal.

## Recebimentos

São derivados das vendas/recebimentos da massa.

Venda em D → recebimento em D+1.

Remover somente as colunas:
- EC
- Qtd

quando presentes na referência da conciliação.

## Seleção

Ao selecionar checkbox de um recebimento:
- atualizar `Recebimentos`;
- atualizar `Total Contrapartidas`;
- ambos devem refletir exatamente a seleção.

Ao selecionar checkbox do lançamento correspondente no extrato:
- atualizar `Total Extrato`.

Calcular:
`Diferença = Total Extrato - Total Contrapartidas`

Quando a diferença for exatamente R$ 0,00:
- exibir `0,00`;
- usar a indicação verde conforme o print;
- habilitar visualmente `Conciliar Selecionados`;
- botão muda do estado cinza/desabilitado para azul/habilitado.

Enquanto a diferença não for zero ou não houver seleção válida:
- `Conciliar Selecionados` permanece desabilitado/cinza.

Não permitir conciliar valores incompatíveis apenas para avançar a demo.

## Conciliação concluída

Ao clicar em `Conciliar Selecionados` com diferença zero:
1. marcar em memória os recebimentos selecionados como conciliados;
2. marcar os lançamentos de extrato correspondentes como utilizados/conciliados;
3. mostrar brevemente uma mensagem de sucesso;
4. a mensagem desaparece automaticamente, sem exigir clique;
5. remover da grade os recebimentos já conciliados;
6. remover da grade os lançamentos de extrato já utilizados;
7. recalcular totais e seleção;
8. refletir o novo estado nas telas dependentes, inclusive `Baixado` quando aplicável.

A mensagem deve parecer pertencente ao sistema; não usar um toast moderno destoante do print.

## Outras abas/seções

- Ajustes: manter visualmente, sempre vazio;
- Cancelamentos: manter visualmente, sempre vazio;
- Conciliação Pix: indisponível para clique e acinzentada;
- Conciliados: indisponível para clique e acinzentada.

## Reiniciar Simulação

Disponibilizar uma ação `Reiniciar Simulação` no fluxo de demonstração.

Ela deve:
- restaurar a cópia em memória da massa original;
- desfazer todas as conciliações da sessão;
- limpar seleções;
- restaurar recebimentos e extratos removidos;
- retornar o fluxo a um estado inicial coerente.

Como esse controle não existe nos prints originais, inseri-lo de forma discreta, sem deslocar ou descaracterizar o layout principal. Fidelidade visual continua sendo prioridade.

---

# 17. Filtros: requisito obrigatório

Todo filtro visível que faça parte das telas implementadas deve funcionar de verdade, salvo elementos explicitamente definidos como apenas visuais/indisponíveis neste documento.

Não simular filtro alterando apenas o texto.

Filtrar a fonte de dados e recalcular:
- linhas;
- agrupamentos;
- totalizadores;
- gráfico;
- valores derivados.

Combinações de filtros devem funcionar juntas.

Não permitir que tabela diga um total e o card/gráfico derivado da mesma consulta diga outro.

---

# 18. Arquitetura Angular

Projeto atual: Angular 22.x.

Usar os recursos atuais do Angular e TypeScript estrito sem criar complexidade desnecessária.

Estrutura sugerida (pode ajustar nomes, mantendo responsabilidades claras):

```text
src/app/
  core/
    demo-data/
      demo-data.ts
      demo-data.models.ts
      demo-state.service.ts
      demo-calculations.ts
  layout/
    top-navbar/
    app-shell/
  shared/
    ...
  features/
    home/
    sales-report/
    fees-report/
    monthly-report/
    branches/
    manual-reconciliation/
```

Princípios:
- componentes não devem possuir cópias independentes da massa;
- cálculos financeiros centralizados;
- estado mutável da sessão centralizado;
- componentes focados em apresentação/interação;
- evitar um `app.ts` ou template monolítico;
- evitar abstração excessiva para apenas seis telas;
- reutilizar navbar, tabelas/controles somente quando isso não prejudicar a fidelidade visual;
- rotas reais para páginas principais;
- estados internos para etapas da Nova Conciliação.

Não criar backend.

---

# 19. CSS e fidelidade

Priorizar CSS próprio.

Pode usar valores explícitos de tamanho quando necessários para reproduzir a interface de referência. Este é um caso em que fidelidade ao sistema legado é mais importante do que criar um design system genérico.

A aplicação deve funcionar adequadamente em desktop e manter a composição em resoluções próximas às referências.

Não sacrificar a reprodução desktop para criar um layout mobile que não foi solicitado.

Evitar scroll horizontal global desnecessário; tabelas muito largas podem usar comportamento coerente com o sistema original.

---

# 20. Bibliotecas

Antes de adicionar dependência:
1. verificar se é realmente necessária;
2. preferir implementação Angular/CSS nativa para UI;
3. biblioteca de gráfico é aceitável;
4. não instalar framework visual que altere a aparência.

Qualquer biblioteca deve ser adaptada visualmente ao PNG.

---

# 21. Ordem de implementação

Executar em etapas e manter o projeto compilando entre elas:

1. Ler TODOS os PNGs e `instrucao.md`.
2. Criar models e massa fictícia determinística.
3. Criar cálculos financeiros e estado em memória.
4. Criar shell/navbar fiel aos prints.
5. Implementar Tela Inicial e fazer os números/gráfico derivarem da massa.
6. Implementar Relatório de Vendas + expansão/detalhamento.
7. Implementar Ajustes e Taxas.
8. Implementar Resultado Mensal.
9. Implementar Filiais.
10. Implementar `Conciliação > Nova Conciliação` e seus quatro estados.
11. Integrar a mutação de conciliação às demais telas.
12. Implementar `Reiniciar Simulação`.
13. Fazer revisão visual de TODAS as telas contra os PNGs.
14. Corrigir divergências visuais.
15. Rodar build/testes.

Não considerar uma tela concluída apenas porque "funciona". Ela também precisa estar visualmente próxima do PNG.

---

# 22. Validação obrigatória

Antes de encerrar o trabalho:

## Consistência financeira
Validar por código/testes:
- soma do bruto = Total Vendido correspondente;
- valor taxa = bruto × taxa;
- líquido = bruto - taxa;
- recebimento corresponde ao líquido/consolidação prevista;
- extrato conciliável corresponde exatamente ao recebimento;
- D+1 está correto;
- filtros não quebram os totais;
- conciliação remove apenas itens selecionados/correspondentes.

## Estado
Validar:
- abrir a aplicação começa no estado original;
- duas abas independentes não compartilham mutações;
- conciliar altera somente a memória da aba;
- F5 restaura;
- Reiniciar Simulação restaura;
- após conciliar, itens somem;
- mensagem de sucesso some sozinha;
- Resultado Mensal reflete o estado aplicável.

## Visual
Para cada PNG:
- renderizar a tela no navegador;
- comparar lado a lado com a referência;
- corrigir alinhamento, largura, altura, fontes, cores, bordas e espaçamentos;
- não declarar sucesso enquanto houver diferenças grosseiras perceptíveis.

---

# 23. Testes mínimos

Criar testes úteis para as regras que não podem quebrar:
- cálculo das taxas;
- cálculo do líquido;
- D+1;
- filtros;
- soma dos totais;
- correspondência recebimento ↔ extrato;
- diferença da conciliação;
- habilitação do botão somente com diferença zero e seleção válida;
- mutação e reset do estado.

Não gastar esforço criando testes cosméticos de pouco valor enquanto as telas ainda estiverem visualmente divergentes.

---

# 24. Critérios de conclusão

O projeto só está pronto quando:

- a URL raiz abre a tela inicial;
- as telas são visualmente fiéis aos PNGs;
- Cadastros, Manutenção e Sair não aparecem;
- Início funciona;
- Filiais funciona;
- hover em Conciliação mostra `Nova Conciliação`;
- clicar em Nova Conciliação abre o estado de `novaconciliacaoManual1.png`;
- o fluxo segue os quatro PNGs na ordem correta;
- relatórios são selecionáveis pela tela inicial;
- filtros funcionam;
- até 15 vendas/dia compõem a massa fixa de agosto/2026;
- todos os totais são derivados da mesma massa;
- taxas e líquidos batem;
- recebimentos e extratos correspondentes batem;
- a conciliação funciona;
- a mensagem de sucesso é temporária;
- itens conciliados somem;
- Reiniciar Simulação restaura o estado;
- nenhuma sessão de outro visitante é afetada;
- `npm run build` conclui sem erro.

---

# 25. Regra final para o agente

Não faça perguntas sobre decisões já especificadas aqui.

Quando algum detalhe menor não estiver explicitamente definido:
1. consultar primeiro o PNG;
2. consultar o `instrucao.md` da tela;
3. preservar o comportamento/visual observado;
4. escolher a solução mais simples que mantenha coerência com a demo.

**Não redesenhe. Não "melhore" o Valida. Reproduza o Valida mostrado nos prints e faça a massa fictícia dirigir o comportamento.**

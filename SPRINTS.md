# SPRINTS.md — Demonstração Valida

Este arquivo organiza a execução do projeto em sprints. O `AGENTS.md` continua sendo a especificação principal e permanente.

## Regra de execução

Antes de QUALQUER sprint:
1. Leia integralmente `AGENTS.md` e esta sprint.
2. Inspecione os PNGs e `instrucao.md` relacionados.
3. Execute SOMENTE a sprint solicitada.
4. Não antecipe sprints futuras.
5. Execute testes relevantes e `npm run build`.
6. Corrija erros antes de encerrar.
7. Informe resumidamente arquivos criados/alterados e decisões relevantes.
8. PARE e aguarde validação do usuário.

Para sprints visuais, compilar não significa concluir: compare a renderização com o PNG e ajuste HTML/CSS.

---

# Sprint 1 — Fundação de dados e estado

## Objetivo
Criar o motor da demonstração antes das telas.

## Fazer
- Ler TODOS os PNGs e `instrucao.md` para compreender os dados necessários.
- Criar models/interfaces para empresa/filial, venda, taxa, recebimento, lançamento de extrato, conciliação e filtros.
- Criar massa fixa/determinística de agosto/2026 conforme `AGENTS.md`.
- Usar `CONCILIADOR DEMONSTRAÇÃO`, CNPJ `10723113000179`.
- Gerar no máximo 15 vendas por dia.
- Respeitar adquirente, bandeiras, serviços, financiamento, limites de valores e taxas definidos no `AGENTS.md`.
- Datas de recebimento D+1.
- IDs/NSU/autorização fictícios, fixos e determinísticos.
- Implementar a relação `Venda -> Taxa -> Líquido -> Recebimento -> Extrato`.
- O extrato deve derivar do recebimento e o valor conciliável deve bater exatamente.
- Centralizar cálculos de bruto, taxa, líquido, totais, agrupamentos e diferença.
- Preferir centavos inteiros internamente.
- Criar estado exclusivamente em memória, independente por aba.
- Não usar backend, localStorage, sessionStorage, cookies ou persistência remota.
- Implementar reset para restaurar a massa original.
- Criar testes para taxas, líquido, D+1, totais, recebimento ↔ extrato e reset.

## NÃO fazer
Não implementar Tela Inicial, navbar final, relatórios visuais, Filiais ou Nova Conciliação.

## Aceite
Massa determinística, máximo 15 vendas/dia, relações financeiras consistentes, recebimento/extrato batendo, reset funcional, testes e build passando.

---

# Sprint 2 — Shell, Navbar e Tela Inicial

## Referências
- `img/telainicial/telaincial.png`
- `img/telainicial/instrucao.md`

## Fazer
- Criar shell/layout compartilhado.
- Reproduzir navbar conforme PNG e `AGENTS.md`.
- Remover Cadastros, Manutenção e Sair.
- Início funcional; preparar Conciliação e rota de Filiais sem inventar páginas.
- Fazer `/` abrir a Tela Inicial.
- Reproduzir o PNG com máxima fidelidade.
- Implementar indicadores, gráfico, formulário e filtros.
- Tipo de Relatório, Detalhamento quando aplicável, Data Inicial/Final, Adquirente, Bandeira e Gerar.
- Aplicar as remoções definidas no `AGENTS.md`.
- Cards e gráfico devem derivar da massa da Sprint 1.
- Filtros devem funcionar sobre a fonte real.
- Gerar deve ficar preparado para os relatórios posteriores.

## Revisão visual obrigatória
Executar a aplicação, comparar com `telaincial.png` e iterar CSS/HTML até reduzir diferenças perceptíveis em navbar, dimensões, cards, gráfico, formulário, fontes, cores, bordas e espaçamentos.

## NÃO fazer
Não implementar ainda Relatório de Vendas, Taxas, Resultado Mensal, Filiais ou Nova Conciliação.

## Aceite
Tela Inicial fiel, dados reais da massa, filtros funcionais, testes e build passando.

---

# Sprint 3 — Relatório de Vendas e Detalhamento

## Referências
- `img/relatorioVendas/statusconciliacaodevendas.png`
- `img/relatorioVendas/detalhamentoVendas.png`
- `img/relatorioVendas/intrucao.md`

## Fazer
- Implementar o Relatório de Vendas usando a massa e cálculos centrais.
- Na Tela Inicial, ao selecionar `Relatório de Vendas` e clicar `Gerar`, abrir o relatório em uma **nova aba/janela**. A Tela Inicial deve permanecer aberta.
- Transportar os filtros pela URL/query params, sem `localStorage`, `sessionStorage` ou backend. F5 na aba do relatório deve reconstruir os mesmos dados/filtros.
- Reproduzir `statusconciliacaodevendas.png`.
- Remover a coluna `Não Lançado`.
- Calcular agrupamentos e `Total Vendido` a partir dos dados filtrados.
- O botão `+` deve expandir/recolher o grupo na própria página do relatório.
- O estado expandido deve reproduzir `detalhamentoVendas.png`.
- O detalhamento deve usar exatamente as vendas que compõem aquele agrupamento; sua soma deve bater com o total do grupo.
- Respeitar Status Venda `Confirmado`, Status Recebimento `Pendente` quando aplicável, D+1, `A Vista` e demais regras do `AGENTS.md`.
- Filtros devem recalcular linhas, agrupamentos, totais e detalhamento.

## Visual
Os PNGs definem estrutura, proporções, cores, tipografia e espaçamentos, **não a resolução da aplicação**. Não usar as dimensões do PNG como tamanho fixo e não aplicar `width: 100%` indiscriminadamente. Manter o layout proporcional em diferentes resoluções desktop.

Comparar visualmente:
- relatório fechado → `statusconciliacaodevendas.png`;
- relatório expandido → `detalhamentoVendas.png`.

## Não fazer
Não implementar Taxas, Resultado Mensal, Filiais ou Nova Conciliação. Não alterar desnecessariamente a Tela Inicial/navbar aprovadas.

## Aceite
- `Gerar` abre nova aba e mantém a Tela Inicial aberta;
- filtros chegam corretamente e sobrevivem ao F5;
- dados/totais vêm da massa central;
- expansão `+` funciona e soma corretamente;
- estados fechado e expandido fiéis aos PNGs;
- testes, `npm run build` e `git diff --check` passam.

Parar após concluir. NÃO avançar para a Sprint 4.

---

# Sprint 4 — Ajustes e Taxas

## Referências
- `img/relatorioTaxas/taxasADM.png`
- `img/relatorioTaxas/instrucao.md`

## Fazer
- Reproduzir o PNG.
- Usar a mesma massa central.
- Taxa contratual: Débito 0,75%; Crédito 1,10%; Voucher 3,60%.
- Taxa praticada determinística por adquirente, bandeira, serviço e financiamento: contratual -0,01 p.p., +0,01 p.p., +0,02 p.p. ou +0,03 p.p.
- Exceção Ticket: taxa contratual de 3,60% e taxa praticada de 6,25% em todas as suas vendas.
- Não usar aleatoriedade em runtime.
- Calcular todos os totais da massa.
- Respeitar filtros.

## Revisão visual obrigatória
Comparar com `taxasADM.png`.

## Aceite
Taxas corretas/estáveis, totais coerentes, filtros, visual fiel, testes e build passando.

---

# Sprint 5 — Resultado Mensal

## Referências
- `img/relatorioMensal/resultadomensal.png`
- `img/relatorioMensal/instrucao.md`

## Fazer
- Reproduzir o PNG.
- Total Vendido = bruto.
- Valor Taxa = valor monetário das taxas.
- Ajustes = soma dos ajustes vinculados às vendas; Visa Electron inclui -R$ 50,00 em 02/08.
- Cancelamentos = 0.
- Total Recebido = líquido + ajustes.
- Remover coluna Dias.
- `Baixado`: 0% antes da conciliação aplicável e 100% depois.
- Percentual deve derivar do estado central, nunca hardcoded.
- Respeitar filtros.

## Revisão visual obrigatória
Comparar com `resultadomensal.png`.

## Aceite
Totais coerentes, Baixado ligado ao estado, visual fiel, filtros, testes e build passando.

---

# Sprint 6 — Filiais

## Referências
- `img/filiais/filiais.png`
- `img/filiais/instrucao.md`

## Fazer
- Reproduzir o PNG.
- Navbar → Filiais deve navegar.
- Máximo 4 registros: principal + Filial 1 + Filial 2 + Filial 3.
- Principal: `CONCILIADOR DEMONSTRAÇÃO`, `10723113000179`.
- Empresa atualmente aberta em vermelho conforme referência.
- Não copiar CNPJs reais dos prints para filiais fictícias.

## Revisão visual obrigatória
Comparar com `filiais.png`.

## Aceite
Navegação funcional, registros corretos, destaque correto, visual fiel e build passando.

---

# Sprint 7 — Nova Conciliação: entrada e estados 1–2

## Referências
- `img/conciliacaoManual/novaconciliacaoManual1.png`
- `img/conciliacaoManual/selecaobancosManual.png`
- `img/conciliacaoManual/instrucao.md`

## Fazer
- Hover em `Conciliação` abre submenu no estilo do sistema.
- Submenu contém `Nova Conciliação`.
- `Conciliação` não navega diretamente.
- Clique em Nova Conciliação abre exatamente o estado de `novaconciliacaoManual1.png`.
- Implementar interação que conduz ao estado `selecaobancosManual.png`.
- Implementar seleção de banco/opções conforme instrução.
- Preservar escolhas durante o fluxo.
- Os PNGs são estados da mesma funcionalidade, não páginas independentes.

## NÃO fazer
Não implementar ainda grade final nem conclusão da conciliação.

## Revisão visual obrigatória
Comparar separadamente estados 1 e 2 com seus PNGs.

## Aceite
Hover, submenu, entrada e transição 1→2 funcionais, visual fiel e build passando.

---

# Sprint 8 — Nova Conciliação: estados 3–4 e conciliação

## Referências
- `img/conciliacaoManual/selecaodiasManual.png`
- `img/conciliacaoManual/conciliacaoManual.png`
- `img/conciliacaoManual/instrucao.md`

## Fazer
- Implementar estado de seleção de dias conforme PNG.
- Implementar grade final conforme `conciliacaoManual.png`.
- Extrato à esquerda; Recebimentos à direita.
- Extrato derivado dos recebimentos; valores correspondentes devem bater.
- Recebimentos respeitam D+1.
- Remover EC e Qtd conforme especificação.
- Checkbox de recebimento recalcula Recebimentos e Total Contrapartidas.
- Checkbox de extrato recalcula Total Extrato.
- `Total Contrapartidas = Recebimentos - Cancelamentos + Ajustes`, considerando ajustes positivos ou negativos; o ajuste de aluguel da maquininha em 02/08 é -R$ 50,00.
- `Diferença = Total Extrato - Total Contrapartidas`.
- `Conciliar Selecionados` cinza/desabilitado com seleção inválida.
- Habilitar/azul somente com seleção válida e diferença R$ 0,00.
- Ao conciliar: marcar em memória, mostrar sucesso temporário, remover recebimentos/extratos utilizados, limpar seleção e recalcular.
- Ajustes mostra o aluguel da maquininha em 02/08; Cancelamentos fica vazio.
- Conciliação Pix e Conciliados ficam acinzentados/indisponíveis.
- Implementar `Reiniciar Simulação` discreto, restaurando toda a massa/estado.

## Revisão visual obrigatória
Comparar estados 3 e 4, botão desabilitado/habilitado e pós-conciliação.

## Aceite
Fluxo completo, valores batendo, diferença correta, botão correto, sucesso automático, remoção de itens, reset, visual fiel, testes e build passando.

---

# Sprint 9 — Integração completa

## Objetivo
Garantir que todas as telas representem uma única simulação coerente.

## Fazer
- Conciliação deve refletir no `Baixado` do Resultado Mensal quando aplicável.
- Outras informações dependentes da conciliação devem reagir pelo estado central.
- Reset deve restaurar todas as telas afetadas.
- Validar navegação: Início, três relatórios, Filiais, Conciliação > Nova Conciliação.
- Validar isolamento: duas abas não compartilham mutações; F5 restaura a aba.
- Auditar bruto, taxa, líquido, recebimento, extrato e totais entre todas as telas.
- Eliminar qualquer mock independente que gere divergência.

## Aceite
Fonte única coerente, propagação correta de estado, reset completo, isolamento por aba, navegação, testes e build passando.

---

# Sprint 10 — Auditoria visual e entrega

## Objetivo
Não adicionar funcionalidades novas. Revisar e finalizar.

## PNGs a revisar
- `img/telainicial/telaincial.png`
- `img/relatorioVendas/statusconciliacaodevendas.png`
- `img/relatorioVendas/detalhamentoVendas.png`
- `img/relatorioTaxas/taxasADM.png`
- `img/relatorioMensal/resultadomensal.png`
- `img/filiais/filiais.png`
- `img/conciliacaoManual/novaconciliacaoManual1.png`
- `img/conciliacaoManual/selecaobancosManual.png`
- `img/conciliacaoManual/selecaodiasManual.png`
- `img/conciliacaoManual/conciliacaoManual.png`

## Auditoria visual
Para cada estado: renderizar → comparar → corrigir → comparar novamente.

Revisar:
- largura/altura;
- posicionamento;
- margens/paddings;
- tipografia;
- cores;
- bordas/fundos;
- tabelas;
- navbar;
- inputs/selects;
- botões;
- gráfico;
- densidade visual.

NÃO modernizar.

## Auditoria funcional
Revalidar filtros, relatórios, expansão, navegação, hover, quatro estados da conciliação, seleção, totais, diferença, conciliar, sucesso temporário, remoção, Baixado, reset e isolamento entre abas.

## Auditoria técnica
Verificar console, warnings relevantes, imports/código morto, duplicações grosseiras, TypeScript estrito, ausência de persistência indevida/backend e dependências visuais desnecessárias.

Executar todos os testes e `npm run build`.

## Aceite final
Fidelidade visual alta + comportamento do `AGENTS.md` + massa coerente + cálculos corretos + filtros funcionais + conciliação funcional + isolamento por aba + build sem erros.

---

# Sprint 11 — Tutorial Interativo da Prévia

## Objetivo
Criar um tutorial guiado e opcional sobre a aplicação real, com foco visual nos elementos explicados e etapas interativas.

O tutorial é apenas uma camada de orientação. Ele NÃO cria uma simulação separada e NÃO altera o comportamento normal da aplicação.

## Início
Após o usuário clicar em `OK` no aviso inicial já existente, exibir:

`Deseja iniciar o tutorial da prévia?`

Opções:
- `Sim` → inicia o tutorial;
- `Não` → fecha o aviso e libera o uso normal.

O tutorial funciona somente em memória e pode ser oferecido novamente após reload.

## Visual
Durante o tutorial:
- escurecer o restante da interface com overlay;
- manter o elemento explicado em destaque/foco;
- elemento destacado deve continuar clicável quando a etapa exigir interação;
- mostrar balão/card explicativo próximo ao elemento;
- usar `>` para avançar etapas apenas informativas;
- reposicionar o balão automaticamente para não sair da viewport;
- usar animações/transições discretas de foco.

Manter sempre no canto superior direito:

`Encerrar tutorial`

Esse botão deve permanecer acima do overlay e sempre clicável.

Ao clicar:
- parar imediatamente o tutorial;
- remover overlay, destaque, balão e animações;
- ocultar `Encerrar tutorial`;
- manter intacto tudo que o usuário já fez na aplicação.

Encerrar o tutorial NÃO desfaz filtros, navegação, conciliações ou qualquer outro estado real.

## Interação real
Toda ação solicitada pelo tutorial deve utilizar os controles reais da aplicação.

Exemplo:

`Agora selecione a Data Inicial e a Data Final desejadas.`

Destacar os campos reais e aguardar o usuário preenchê-los.

Depois:

`Agora clique em Gerar para visualizar o relatório.`

Destacar o botão `Gerar` real e aguardar o clique.

O clique deve executar EXATAMENTE o comportamento normal da aplicação.

Se o usuário escolheu determinado:
- relatório;
- período;
- bandeira;
- adquirente;
- filtro;

essas escolhas devem ser respeitadas normalmente.

O tutorial apenas observa a ação e continua. Não deve alterar valores, clicar automaticamente ou produzir resultados especiais para o tutorial.

## Fluxo

### 1. Tela Inicial
Explicar progressivamente:
- cards/indicadores;
- gráfico;
- Tipo de Relatório;
- filtros;
- Data Inicial e Data Final;
- botão Gerar.

Incluir etapas interativas para seleção dos filtros e uso real do `Gerar`.

### 2. Relatórios
Quando o usuário gerar um relatório, continuar o tutorial sobre o relatório realmente escolhido e aberto.

Explicar os elementos disponíveis naquela página, incluindo agrupamentos, totais e detalhamento quando existirem.

No Relatório de Vendas, por exemplo, destacar o `+` e solicitar o clique real para demonstrar o detalhamento.

Como relatórios podem abrir em nova aba, transportar pela URL/query params apenas a informação necessária para continuar o tutorial, sem `localStorage` ou `sessionStorage`.

### 3. Filiais
Guiar o usuário de volta/para a aplicação principal e destacar `Filiais` na navbar.

Explicar onde ficam as filiais e solicitar o clique real.

Na tela de Filiais, destacar a listagem e explicar:
- empresa principal;
- filiais disponíveis;
- empresa atualmente selecionada.

### 4. Conciliação Manual
Destacar `Conciliação` e orientar o usuário a acessar `Nova Conciliação`.

Guiar progressivamente pelos estados:
- Nova Conciliação;
- seleção do banco;
- seleção dos dias;
- grade de conciliação.

Na grade final, explicar/destacar:
- Extrato;
- Recebimentos;
- Total Extrato;
- Total Contrapartidas;
- Diferença;
- Conciliar Selecionados.

Quando a etapa solicitar uma ação, aguardar a interação real do usuário.

A conciliação realizada durante o tutorial deve ser uma conciliação REAL da demonstração e seguir exatamente as regras já implementadas.

## Tipos de etapa
O sistema do tutorial deve suportar:

1. `informativa` — explicação + avanço pelo `>`;
2. `interativa` — aguarda ação real no elemento destacado;
3. `navegação` — aguarda usuário chegar à tela/estado esperado.

Etapas interativas obrigatórias não devem poder ser puladas pelo `>`.

`Encerrar tutorial` continua disponível em qualquer tipo de etapa.

## Arquitetura
Centralizar a definição do tutorial, evitando lógica espalhada pelos componentes.

Cada etapa deve poder definir:
- elemento-alvo;
- texto;
- tipo;
- condição para avançar;
- rota/tela esperada;
- próximo passo.

Usar identificadores/atributos estáveis nos elementos reais para os alvos do tutorial, evitando seletores CSS frágeis.

Não duplicar componentes ou telas para criar o tutorial.

## Regras importantes
- tutorial usa a aplicação REAL;
- overlay não pode impedir interação com o elemento em foco;
- não automatizar ações do usuário;
- não modificar regras financeiras;
- não criar massa específica para o tutorial;
- não usar `localStorage` ou `sessionStorage`;
- não redesenhar telas existentes;
- tutorial desligado não pode interferir no funcionamento normal;
- ações realizadas durante o tutorial permanecem após encerrá-lo.

## Aceite
- pergunta aparece após o `OK` do aviso inicial;
- `Sim` inicia e `Não` fecha;
- overlay e foco funcionam;
- elemento interativo destacado permanece utilizável;
- `>` avança etapas informativas;
- etapas interativas aguardam ações reais;
- `Gerar` continua usando os filtros reais escolhidos;
- tutorial acompanha Tela Inicial → Relatórios → Filiais → Conciliação Manual;
- `Encerrar tutorial` fica sempre disponível no canto superior direito;
- encerrar remove somente a camada do tutorial;
- tutorial funciona em diferentes resoluções desktop;
- funcionamento normal da aplicação permanece intacto;
- testes, `npm run build` e `git diff --check` passam.

Parar após concluir esta sprint.

# Prompt para iniciar uma sprint

Use este formato:


# Prompt para pedir correção sem avançar

> Continue SOMENTE na Sprint X. Não avance. Compare novamente a implementação com os PNGs de referência dessa sprint e corrija as divergências visuais/funcionais encontradas. Ao terminar, teste, execute `npm run build` e pare novamente para minha validação.

# Commits sugeridos

- Sprint 1: `feat: cria dados e estado da demonstracao`
- Sprint 2: `feat: implementa tela inicial`
- Sprint 3: `feat: implementa relatorio de vendas`
- Sprint 4: `feat: implementa relatorio de taxas`
- Sprint 5: `feat: implementa resultado mensal`
- Sprint 6: `feat: implementa filiais`
- Sprint 7: `feat: inicia fluxo de conciliacao manual`
- Sprint 8: `feat: conclui conciliacao manual`
- Sprint 9: `feat: integra estado da demonstracao`
- Sprint 10: `chore: finaliza demonstracao`

---

# REGRA FINAL

**UMA SPRINT POR VEZ.**

O `AGENTS.md` define como o projeto deve funcionar. O `SPRINTS.md` define em que ordem construí-lo.

**OS PNGs SÃO A ESPECIFICAÇÃO VISUAL.**
**A resolução do PNG nunca deve ser tratada como resolução obrigatória da aplicação..**

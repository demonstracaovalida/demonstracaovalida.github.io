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
- Reproduzir `statusconciliacaodevendas.png`.
- Usar massa e filtros da Tela Inicial.
- Remover coluna `Não Lançado`.
- Total Vendido calculado.
- Fazer `+` expandir/recolher o grupo.
- Estado expandido deve reproduzir `detalhamentoVendas.png`.
- Detalhamento deve usar as vendas reais daquele grupo, não mocks independentes.
- Status Venda Confirmado; Recebimento Pendente quando aplicável; depósito D+1; A Vista.
- Filtros devem recalcular linhas, grupos, total e detalhamento.

## Revisão visual obrigatória
Comparar estado fechado e expandido com os dois PNGs.

## Aceite
Fluxo pela Tela Inicial, dados coerentes, expansão funcional, visual fiel, filtros, testes e build passando.

---

# Sprint 4 — Ajustes e Taxas

## Referências
- `img/relatorioTaxas/taxasADM.png`
- `img/relatorioTaxas/instrucao.md`

## Fazer
- Reproduzir o PNG.
- Usar a mesma massa central.
- Taxa praticada: Débito 0,75%; Crédito 1,10%; Voucher 3,60%.
- Taxa contrato determinística: praticada -0,02 p.p., igual, ou +0,02 p.p.
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
- Ajustes e Tarifas = 0.
- Cancelamentos = 0.
- Total Recebido = líquido.
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
- `Diferença = Total Extrato - Total Contrapartidas`.
- `Conciliar Selecionados` cinza/desabilitado com seleção inválida.
- Habilitar/azul somente com seleção válida e diferença R$ 0,00.
- Ao conciliar: marcar em memória, mostrar sucesso temporário, remover recebimentos/extratos utilizados, limpar seleção e recalcular.
- Ajustes e Cancelamentos ficam vazios.
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

# Prompt para iniciar uma sprint

Use este formato:

> Leia integralmente `AGENTS.md` e `SPRINTS.md`. Execute SOMENTE a Sprint X do `SPRINTS.md`. Inspecione os PNGs e `instrucao.md` relacionados antes de alterar o código. Não antecipe outras sprints. Ao terminar, execute os testes relevantes e `npm run build`, corrija erros e pare para minha validação.

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

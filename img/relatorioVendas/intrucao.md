Regra: a tela deve ser identica aos prints
Esse é o relatório de vendas, ele deve abrir um relatório informando quais vendas o cliente teve com base no dia ou periodo de data que foi aberto

Coluna não lançado removido

Inicialmente irá ter o valor total de vendas em Total Vendido
Ao clicar em "+" vai aparecer quais vendas foram vendidas 
Para data deposito, iremos trabalhar com sempre d+1, ou seja, se vendeu dia 22/09, data deposito será 23/09

geração de vendas para alimentar relatório

Adquirente: Cielo
Bandeiras: Visa Electron, Visa Credito, Mastercard, Elo, Alelo, VR Beneficios, Ticket
tipos de serviço: Crédito, Débito, Voucher
financiamento: sempre A vista
taxa: 0.75% para débitos, 1.1% para créditos, 3,6% para vouchers
Status Vendas: Sempre confirmado
Status recebimento: sempre pendente

Limite de geração de 5 vendas por dia 
Limite de valor Parcela .random =  maior que 0,99 menos que 101
Valor liquido sempre será valor parcela - % do tipo de serviço


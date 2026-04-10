

## Segurança de Pagamento Offline, Formulário Inteligente e NF

### Implementado

**1. Segurança Anti-Fraude (Pagamento Offline)**
- Comprador informa pagamento ("Já paguei") com comprovante ou referência
- Após informar pagamento, fornecedor NÃO pode cancelar — só contestar com motivo
- Comprador pode cancelar apenas enquanto `pending` e sem pagamento informado
- Fornecedor pode cancelar apenas se `pending`/`accepted` e sem pagamento informado
- Triggers validam no banco: `validate_negotiation_status_transition` e `validate_order_status_transition`
- Subfluxo: `not_reported → reported_by_buyer → confirmed_by_supplier | contested_by_supplier`

**2. Formulário de Negociação Inteligente**
- Cálculo automático de valor baseado em `sale_unit`, `units_per_sale_unit`, `product_price_tiers`
- Exibe preço por unidade/caixa/fardo e total estimado
- Seção colapsável "Dados para NF" pré-preenchida do perfil/endereço
- Dados salvos como snapshot na negociação (`buyer_data` JSONB)

**3. Nota Fiscal**
- Fornecedor faz upload de NF (PDF/imagem) direto na negociação
- Comprador baixa NF na tela de negociações
- Bucket `invoices` no Supabase Storage

**4. Botões de Cancelamento**
- Buyer: botão "Cancelar" visível em `pending` (some se pagamento informado)
- Supplier: botão "Recusar/Cancelar" visível em `pending`/`accepted` (some se pagamento informado)
- Bloqueado para ambos após `shipped`/`delivered`

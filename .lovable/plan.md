

## Plan: Limpar Todos os Dados das Tabelas

### O que será feito
Uma migration SQL para `TRUNCATE CASCADE` todas as tabelas públicas, removendo todos os dados de teste (usuários, produtos, variações, assinaturas, etc.) mas mantendo a estrutura intacta.

### Tabelas que serão limpas (com dados)
- `profiles` (22 linhas) - todos os perfis de teste
- `products` (18 linhas) - todos os produtos de teste
- `product_variations` (18 linhas)
- `product_price_tiers` (5 linhas)
- `user_roles` (23 linhas)
- `supplier_subscriptions` (2 linhas)
- `supplier_shipping_config` (1 linha)

Também limpar as tabelas que já estão vazias para garantir (notifications, orders, messages, etc.)

### Ação manual necessária
Os usuários no `auth.users` (autenticação do Supabase) não podem ser deletados via migration SQL. Após a limpeza, você precisará ir no painel do Supabase em **Authentication > Users** e deletar todos os usuários manualmente.

Link: https://supabase.com/dashboard/project/juvywnnpcbhwarhwxcgc/auth/users

### Resultado
- Banco completamente limpo, pronto para lançamento
- Todas as tabelas vazias, estrutura preservada
- Novos usuários poderão criar conta normalmente

### Detalhes Técnicos
- Uma migration com `TRUNCATE ... CASCADE` em todas as tabelas públicas
- CASCADE garante que dependências entre tabelas sejam respeitadas
- Banco deve cair para ~10-15MB (apenas estrutura)


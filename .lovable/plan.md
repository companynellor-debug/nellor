

## Plan: Limpeza do Banco de Dados

### O Problema
O banco está em **565 MB** e o Supabase está avisando que excedeu a cota. A tabela `push_notification_logs` sozinha ocupa **350 MB** (715.268 linhas) — é a principal culpada.

Além disso, há **funcionalidades inativas** (Nellor Drop, Afiliados, Prestador de Serviço, Stories, Patrocínios, Cotações) com tabelas e funções RPC ocupando espaço desnecessário.

### Ações

#### 1. Limpar push_notification_logs (PRIORIDADE MÁXIMA)
- Criar migration para **TRUNCATE** a tabela `push_notification_logs` (libera ~350 MB imediatamente)
- Adicionar política de retenção: criar trigger ou cron que deleta logs com mais de 7 dias

#### 2. Dropar tabelas de funcionalidades inativas
Tabelas a remover (todas vazias ou com dados de teste):

**Drop/Nellor Drop (7 tabelas):**
- `client_drop_products`, `client_drop_profiles`, `drop_audit_log`, `drop_orders`, `product_drop_settings`, `supplier_drop_settings`

**Afiliados (6 tabelas):**
- `affiliate_attributions`, `affiliate_commission_items`, `affiliate_commissions`, `affiliate_links`, `affiliates`, `supplier_affiliate_settings`

**Prestador de Serviço (5 tabelas):**
- `service_provider_contract_requests`, `service_provider_crm`, `service_provider_requests`, `service_provider_suppliers`, `supplier_service_provider_settings`, `service_providers`

**Stories (2 tabelas):**
- `supplier_stories`, `story_views`

**Patrocínios (2 tabelas):**
- `sponsored_products`, `sponsorship_requests`

**Cotações (2 tabelas):**
- `quotation_proposals`, `quotation_requests`

**Outros inativos (4 tabelas):**
- `shared_carts`, `trend_requests`, `messages_archive`, `user_sessions`

**Total: ~28 tabelas removidas** (de 63 → ~35)

#### 3. Dropar funções RPC associadas
17 funções a remover:
- `accept_service_provider_invite`, `create_affiliate_commission_for_order`, `generate_affiliate_code`, `get_admin_affiliates`, `get_admin_service_providers`, `get_admin_sponsorship_requests`, `get_client_drop_stats`, `get_drop_admin_stats`, `get_drop_catalog`, `get_drop_clients_admin`, `get_drop_suppliers_admin`, `get_story_views`, `get_supplier_drop_stats`, `log_drop_audit`, `notify_new_sponsorship_request`, `track_affiliate_click`, `update_affiliate_earnings`

#### 4. Remover código frontend das features inativas
- Remover páginas: `DropCatalogo`, `DropConfiguracoes`, `DropDashboard`, `DropFinanceiro`, `DropMarketplaces`, `DropMeusProdutos`, `DropModeLayout`, `DropNotificacoes`, `DropPedidos`, `NellorDrop` (admin + fornecedor)
- Remover páginas: `ProgramaAfiliados`, `AfiliadoCadastro`, `AffiliatePrestadores`, `PrestadorServicos`, `Cotacoes` (cliente + fornecedor), `CompararFornecedores`, `Patrocinio`
- Remover componentes: `AffiliateTracker`, `AffiliateSettingsPanel`, `ServiceProviderCodePanel`, `ServiceProviderIntegration`, `ServiceProviderProducts`, `SupplierProductDropModal`, `ModeSwitcher`, `ProductDetailModal`, `SupplierStories`, `StoryViewer`, `CreateStoryModal`, `SearchSuppliersSheet`, `ContractApprovalPanel`, `ServiceProviderRequestsPanel`
- Remover hooks: `useAffiliateTracking`, `useSupplierAffiliateSettings`, `useSupplierDrop`, `useClientDrop`, `useAdminDrop`, `useSupplierStories`, `useCollections`, `useQuotations`, `useSponsoredProducts`, `useAppMode`
- Limpar rotas no `App.tsx`
- Remover edge functions: `admin-sponsorship-action`

#### 5. Dropar tipos enum não utilizados
- `affiliate_status`, `commission_status` e outros associados às features removidas

### Resultado Esperado
- Banco de ~**50-80 MB** (redução de ~85%)
- De 63 para ~35 tabelas
- Código frontend significativamente mais limpo
- Cota do Supabase normalizada

### Detalhes Técnicos
- Uma migration SQL fará o TRUNCATE + DROP TABLE CASCADE + DROP FUNCTION
- CASCADE garante que foreign keys, triggers e policies sejam removidos junto
- O código frontend será limpo removendo arquivos e referências das rotas


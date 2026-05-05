# Deploy no Vercel - Instruções

## 🚀 Como fazer deploy da última versão

### Passo a Passo:

1. **Salvar no GitHub** (botão "Salvar no GitHub" na plataforma Emergent)
   - Isso faz commit e push das últimas alterações

2. **Vercel Deploy Automático**
   - O Vercel detecta automaticamente o push no GitHub
   - Inicia build automaticamente
   - Deploy em produção após build bem-sucedido

### ⚙️ Configurações do Vercel

O projeto está configurado com:

- **Framework**: Vite
- **Build Command**: `yarn install && yarn build`
- **Output Directory**: `dist`
- **Install Command**: `yarn install`

### 🔄 Forçar Rebuild (se necessário)

Se o Vercel não atualizar automaticamente:

1. Acesse o dashboard do Vercel
2. Vá em "Deployments"
3. Clique em "Redeploy" no último deployment
4. Marque "Use existing Build Cache" como **OFF**
5. Clique em "Redeploy"

### 🐛 Solução de Problemas

**Página em branco após deploy?**

1. Verifique os logs do build no Vercel
2. Certifique-se que o build terminou com sucesso
3. Limpe o cache do navegador (Ctrl + Shift + R)
4. Verifique se as variáveis de ambiente estão configuradas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

**Build falhando?**

- Verifique se todos os arquivos foram commitados
- Confirme que `yarn build` funciona localmente
- Revise os logs de erro no Vercel Dashboard

### 📝 Arquivos de Configuração

- `vercel.json` - Configuração do Vercel (rewrites, headers, cache)
- `.vercelignore` - Arquivos ignorados no deploy
- `vite.config.ts` - Configuração de build do Vite

### 🎯 Cache Control

O projeto está configurado para:
- **index.html**: Sem cache (sempre busca versão mais recente)
- **Assets** (JS/CSS): Cache otimizado com hash nos nomes

Isso garante que sempre serve a versão mais recente!

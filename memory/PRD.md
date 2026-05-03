# Nellor - Marketplace Atacadista Digital

## Original problem statement
"Importe o meu repositório nellor do GitHub e traga ele pra cá" — projeto criado no Lovable, repositório `https://github.com/companynellor-debug/nellor.git`. Usuário deseja editar daqui em diante.

## Stack detectado
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- Supabase (auth + DB) — projeto `juvywnnpcbhwarhwxcgc`
- React Router v6, React Query, React Hook Form, Zod
- PWA (vite-plugin-pwa, workbox)

## Setup realizado (03/05/2026)
- Repositório clonado e movido para `/app/frontend`
- `vite.config.ts` ajustado: porta `3000`, `host 0.0.0.0`, `allowedHosts: true`, HMR via `wss` (clientPort 443)
- `package.json`: adicionado script `start: vite --host 0.0.0.0 --port 3000` (compatível com supervisor)
- `.env` mantém `REACT_APP_BACKEND_URL` (protegido) + variáveis `VITE_SUPABASE_*`
- `yarn install` executado, supervisor `frontend` rodando
- App carrega com sucesso: tela inicial "Marketplace atacadista digital" (Criar conta / Entrar)

## Backend
- Backend FastAPI/MongoDB do template **não é usado** (app utiliza Supabase). Backend supervisor segue rodando, sem alterações.

## Próximos passos / Backlog
- Aguardando instruções do usuário para edições/funcionalidades a partir daqui.

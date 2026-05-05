#!/bin/bash

# Script de Verificação Pré-Deploy
# Execute antes de fazer "Salvar no GitHub"

echo "🔍 Verificando configuração para deploy no Vercel..."
echo ""

# 1. Verificar se arquivos essenciais existem
echo "✓ Verificando arquivos de configuração..."
files=("vercel.json" "vite.config.ts" "package.json")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file existe"
  else
    echo "  ❌ $file não encontrado!"
    exit 1
  fi
done
echo ""

# 2. Verificar variáveis de ambiente
echo "✓ Verificando variáveis de ambiente..."
if [ -f ".env" ]; then
  echo "  ✅ .env existe"
  if grep -q "VITE_SUPABASE_URL" .env; then
    echo "  ✅ VITE_SUPABASE_URL configurada"
  else
    echo "  ⚠️  VITE_SUPABASE_URL não encontrada"
  fi
  if grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env; then
    echo "  ✅ VITE_SUPABASE_PUBLISHABLE_KEY configurada"
  else
    echo "  ⚠️  VITE_SUPABASE_PUBLISHABLE_KEY não encontrada"
  fi
else
  echo "  ⚠️  Arquivo .env não encontrado"
fi
echo ""

# 3. Testar build local
echo "✓ Testando build local..."
if yarn build > /tmp/build.log 2>&1; then
  echo "  ✅ Build local passou!"
else
  echo "  ❌ Build local falhou!"
  echo "  Verifique os erros em /tmp/build.log"
  exit 1
fi
echo ""

# 4. Verificar tamanho do build
if [ -d "dist" ]; then
  size=$(du -sh dist | cut -f1)
  echo "  ✅ Pasta dist criada (tamanho: $size)"
else
  echo "  ❌ Pasta dist não foi criada!"
  exit 1
fi
echo ""

# 5. Verificar TypeScript
echo "✓ Verificando TypeScript..."
if npx tsc --noEmit > /tmp/tsc.log 2>&1; then
  echo "  ✅ TypeScript sem erros"
else
  echo "  ⚠️  Avisos TypeScript encontrados (verifique /tmp/tsc.log)"
fi
echo ""

echo "✅ Tudo pronto para deploy!"
echo ""
echo "📤 Próximos passos:"
echo "  1. Clique em 'Salvar no GitHub'"
echo "  2. Aguarde 2-3 minutos para o Vercel fazer deploy"
echo "  3. Limpe o cache do navegador (Ctrl + Shift + R)"
echo "  4. Acesse seu site no Vercel"
echo ""

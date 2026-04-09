

## Correções do Chat: 4 Problemas Identificados

### Problema 1: Nomes "Cliente" e sem foto no chat do fornecedor
O `useEffect` que busca perfis dos clientes depende de `conversations` como dependência, mas usa `customerProfiles` no filtro de `missingIds` sem incluí-lo como dependência — isso causa uma condição de corrida onde o fetch só roda uma vez e pode falhar silenciosamente. Além disso, o `useSupabaseMessages` é chamado com `user?.id` no fornecedor mas sem parâmetro no cliente, causando inconsistência.

**Correção:** Refatorar o `useEffect` de fetch de perfis para usar um `useCallback` estável e garantir que rode sempre que novas conversas aparecerem. Adicionar retry e logs de erro mais claros.

### Problema 2: Status usa link em vez de upload de arquivo
O `CreateStoryModal` pede uma URL colada manualmente. Precisa ser convertido para upload real via Supabase Storage.

**Correção:**
- Adicionar modo `video` além de `image` e `text`
- Substituir o input de URL por um `<input type="file">` que aceita `image/*,video/*`
- Fazer upload do arquivo para o bucket `supplier-stories` no Supabase Storage
- Salvar a URL pública gerada no campo `media_url`
- Manter preview antes de publicar

### Problema 3: Barra de navegação sobrepõe o input de digitação
No chat do cliente (foto 3), o input está fixo no `bottom-0` mas o `BottomNav` também está fixo no bottom. Ambos competem pelo mesmo espaço.

**Correção:**
- **Cliente:** Quando estiver na view de conversa individual, o `BottomNav` já não aparece (o componente retorna antes do `<BottomNav />`). O problema é o `padding-bottom: 100px` no main que não é suficiente, e o input fixo precisa considerar o safe-area. Ajustar o layout para `flex flex-col h-[100dvh]` com o input como parte do fluxo (não fixo), eliminando o conflito.
- **Fornecedor:** O mobile chat view usa `h-[calc(100vh-4rem)]` mas o `BottomNavFornecedor` fica visível por cima. Esconder o BottomNav quando em conversa individual ou ajustar a altura para `h-[calc(100dvh-8rem)]`.

### Problema 4: Paleta de cores limitada no status de texto
Apenas 8 cores predefinidas. Precisa de um color picker mais completo.

**Correção:**
- Expandir a paleta para ~20 cores populares organizadas em grade
- Adicionar um input `type="color"` como última opção para cor personalizada
- Manter o preview em tempo real

---

### Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `src/pages/fornecedor/ChatFornecedor.tsx` | Fix profile fetch (useEffect deps), esconder BottomNav no chat view, ajustar altura mobile |
| `src/pages/cliente/Chat.tsx` | Remover input fixo, usar layout flex sem sobreposição, ajustar para `100dvh` |
| `src/components/chat/CreateStoryModal.tsx` | Upload real via file input + Supabase Storage, modo vídeo, paleta expandida + color picker |
| `src/hooks/useSupplierStories.tsx` | Atualizar `createStory` para receber File e fazer upload ao Storage |


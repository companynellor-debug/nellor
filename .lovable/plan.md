

## Redesign do Fluxo de Status + Estatísticas de Stories

### Problema Atual
1. O fluxo de criação de status é um modal genérico com 2 passos (escolher tipo → preencher). Não tem o feel do Instagram Stories.
2. Não existe nenhum lugar para o fornecedor ver estatísticas dos seus stories (quem visualizou, quantas views, etc.).

### Solução

#### 1. Redesign do CreateStoryModal — Fluxo estilo Instagram
Reescrever `src/components/chat/CreateStoryModal.tsx` com um fluxo mais imersivo:

- **Tela inicial**: Preview fullscreen (aspect 9:16) com abas na parte inferior: "Texto" e "Mídia"
- **Modo Texto**: Preview em tempo real ocupando a tela toda do modal, campo de texto sobreposto ao preview, paleta de cores na parte inferior como botões circulares + color picker
- **Modo Mídia**: Ao selecionar a aba, abre direto o file picker. Preview fullscreen com a mídia. Campo de legenda sobreposto embaixo
- **Botão "Publicar"** fixo no rodapé, estilo Instagram (gradiente, arredondado)
- **Botão de voltar** no topo para trocar de modo
- Layout escuro (fundo preto/cinza escuro) para dar o feel de criação de story

#### 2. Melhorar o StoryViewer
Em `src/components/chat/StoryViewer.tsx`:
- Para stories do próprio fornecedor (quando clica em "Meu Status"), mostrar no rodapé o **número de visualizações** e um botão "Ver quem viu"
- Ao clicar, abre uma lista (sheet) com os nomes e fotos de quem visualizou, usando o RPC `get_story_views` que já existe
- Botão de deletar story (ícone lixeira no header) para os próprios stories

#### 3. Página de Estatísticas de Stories
Adicionar uma seção de Stories na página `src/pages/fornecedor/Estatisticas.tsx`:
- Card "Meus Status" com: total de stories ativos, total de visualizações, média de views por story
- Lista dos stories ativos com thumbnail, caption, e contagem de views
- Cada item clicável para ver quem visualizou

#### 4. Ajustes no SupplierStories
Em `src/components/chat/SupplierStories.tsx`:
- Quando o fornecedor clica em "Meu Status" e já tem stories, abrir o StoryViewer com os próprios stories (mostrando views)
- Se não tem stories, abrir o CreateStoryModal

---

### Arquivos a Editar

| Arquivo | Mudança |
|---|---|
| `src/components/chat/CreateStoryModal.tsx` | Redesign completo — layout escuro fullscreen, abas Texto/Mídia, preview imersivo |
| `src/components/chat/StoryViewer.tsx` | Mostrar contagem de views e lista de quem viu nos stories próprios, botão deletar |
| `src/pages/fornecedor/Estatisticas.tsx` | Adicionar seção "Meus Status" com stats de views |
| `src/hooks/useSupplierStories.tsx` | Adicionar função `getStoryViews(storyId)` usando o RPC existente |
| `src/pages/fornecedor/ChatFornecedor.tsx` | Ajustar lógica do botão "Meu Status" para abrir viewer quando tem stories |


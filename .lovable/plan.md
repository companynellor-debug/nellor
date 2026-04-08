

## Aplicar Estilo de Icones 3D Dark Glass na Plataforma

A referencia mostra icones com estetica "dark glass" - fundo escuro (charcoal/slate-900) com acentos em roxo/violeta, efeito de brilho e profundidade 3D. Nao da para recortar da imagem (sao raster e ficariam pixelados), mas da para recriar esse estilo com CSS nos icones Lucide existentes.

### O que muda

**Criar componente reutilizavel `DarkGlassIcon`** que aplica o estilo da referencia:
- Fundo escuro (`bg-slate-900`) com borda sutil roxa
- Gradiente de brilho no topo (efeito glass 3D)
- Icone em roxo/violeta ao inves de branco
- Sombra interna para profundidade

### Onde aplicar

**1. Fornecedor - Como Usar (`ComoUsar.tsx`)**
- Trocar `GlassIcon` (fundo colorido com icone branco) por novo estilo dark glass
- Trocar `GlassStepIcon` pelo mesmo estilo em tamanho menor
- Icones dos accordions: fundo escuro com icone roxo brilhante

**2. Cliente - Perfil (`Perfil.tsx`)**
- Secao "Como funciona a Nellor?" - trocar os icones circulares `bg-primary/10` pelo estilo dark glass
- Manter o grid 2x2 mas com icones mais impactantes

### Estilo CSS do componente

```text
Camadas do icone (de tras pra frente):
1. Fundo: bg-slate-900/90 rounded-full
2. Borda: border border-purple-500/30
3. Brilho topo: gradiente branco 15% -> transparente
4. Reflexo lateral: gradiente roxo sutil na lateral
5. Icone: cor purple-400, drop-shadow roxo
```

### Arquivos editados
- `src/pages/fornecedor/ComoUsar.tsx` - substituir GlassIcon e GlassStepIcon pelo estilo dark glass
- `src/pages/cliente/Perfil.tsx` - aplicar estilo dark glass nos icones da secao "Como funciona"


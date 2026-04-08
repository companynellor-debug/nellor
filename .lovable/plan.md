

## Redesign da Tela de Login (Auth.tsx)

A tela de login atual usa um card branco com onda roxa no topo. A referência mostra um design mais elegante com efeito glassmorphism e partículas flutuantes no fundo.

### Mudancas Planejadas

**1. Background com particulas animadas**
- Manter o gradiente roxo como fundo
- Adicionar pontos/particulas flutuantes animados (como na referência) usando CSS animations

**2. Card com efeito Glassmorphism**
- Desktop: card centralizado com fundo semi-transparente branco/frosted (backdrop-blur), bordas arredondadas grandes
- Mobile: layout mais cheio na tela, mas mantendo o mesmo estilo glass
- Remover a onda SVG atual e substituir por um topo roxo com gradiente suave que faz transicao para a area glass branca

**3. Layout do card**
- Topo: area roxa com logo (quadrado arredondado branco com logo dentro) + titulo "Bem-vindo" / "Criar conta"
- Area do formulário: fundo branco semi-transparente com campos de input com bordas arredondadas e labels flutuantes
- "Esqueci minha senha" alinhado a direita
- Botao "ENTRAR" roxo escuro arredondado
- "CRIAR CONTA" e "Voltar" abaixo

**4. Responsividade**
- Desktop (md+): card com max-width ~420px centralizado, sombra forte
- Mobile: card ocupa quase toda a tela com padding lateral minimo, mesmo estilo visual

### Detalhes Tecnicos

- Arquivo editado: `src/pages/Auth.tsx`
- Usar `backdrop-blur-xl` e `bg-white/80` para efeito glass na area do form
- Particulas via divs absolutas com `@keyframes` animation para flutuacao
- Manter toda a logica de autenticacao, admin dialog e forgot password intacta
- Apenas reestruturar o JSX de apresentacao


# Responsividade do Site Público — Design Spec

**Data:** 2026-04-20
**Escopo:** Site público (landing page, catálogo, detalhe de produto, SitesGrid)
**Abordagem:** Revisão sistemática — ajustes cirúrgicos de classes Tailwind, sem alterar estrutura ou design
**Breakpoint base:** 375px (iPhone SE / Android moderno)

---

## Contexto

O site público apresenta problemas de responsividade em telas menores que 768px (`md:`). Os principais sintomas são:

- Heading do hero (`text-6xl` = 60px) cortado ou comprimido em 375px
- Stats do hero em linha sem `flex-wrap` — estouros em telas pequenas
- Padding vertical de seção `py-32` (128px) excessivo em mobile
- CTA final com padding `p-14` e heading `text-4xl` sem redução para mobile
- Steps "Como funciona" com gap e ícone sem ajuste responsivo
- Modal do SitesGrid com `max-w-md p-8` fixo sem margem em telas pequenas
- Produto detalhe com `gap-16` e sticky sem condição de breakpoint

---

## Mudanças por arquivo

### 1. `/app/page.tsx` — Landing page

**Hero — heading (h1)**
```
Antes:  text-6xl md:text-7xl xl:text-8xl
Depois: text-4xl sm:text-5xl md:text-7xl xl:text-8xl
```

**Hero — stats row**
```
Antes:  flex items-center gap-8
Depois: flex flex-wrap items-center gap-6
```

**Todas as seções — padding vertical e horizontal**
```
Antes:  py-32 px-6
Depois: py-16 sm:py-24 lg:py-32 px-4 sm:px-6
```

**Todos os h2 de seção**
```
Antes:  text-4xl md:text-5xl
Depois: text-3xl sm:text-4xl md:text-5xl
```

**Bento grid — padding dos cards**
```
Antes:  p-8
Depois: p-6 lg:p-8
```

**Bento grid — cards de review (p-7)**
```
Antes:  p-7
Depois: p-5 lg:p-7
```

**Steps "Como funciona" — ícone e gap**
```
Antes:  flex gap-8  |  w-16 h-16 rounded-2xl
Depois: flex gap-4 sm:gap-8  |  w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl
```

**CTA final — container e heading**
```
Antes:  p-14 md:p-24  |  text-4xl md:text-6xl
Depois: p-8 sm:p-14 md:p-24  |  text-3xl sm:text-4xl md:text-6xl
```

**Sobre nós — gap do grid**
```
Antes:  gap-16
Depois: gap-8 lg:gap-16
```

---

### 2. `/components/sections/SitesGrid.tsx` — Modal

**Modal — largura e padding**
```
Antes:  max-w-md p-8
Depois: w-full max-w-md mx-4 sm:mx-auto p-6 sm:p-8
```

---

### 3. `/app/(public)/products/page.tsx` — Catálogo

**Padding da página**
```
Antes:  py-32 px-6  (ou equivalente)
Depois: py-16 sm:py-24 lg:py-32 px-4 sm:px-6
```

**Gap do grid de cards**
```
Antes:  gap-6
Depois: gap-4 sm:gap-6
```

---

### 4. `/app/(public)/products/[slug]/page.tsx` — Detalhe do produto

**Gap do layout principal**
```
Antes:  gap-16
Depois: gap-8 lg:gap-16
```

**Sticky da imagem**
```
Antes:  sticky top-28
Depois: lg:sticky lg:top-28
```

---

## O que NÃO muda

- Estrutura de componentes
- Design visual (cores, fontes, animações)
- Lógica de negócio
- Dashboard do cliente
- Painel admin

---

## Critério de sucesso

Todas as seções do site público exibem sem overflow horizontal, sem elementos cortados e com espaçamento adequado em 375px (Chrome DevTools, modo responsivo).

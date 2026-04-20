# Responsividade do Site Público — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todos os problemas de responsividade do site público (landing page, catálogo, detalhe de produto, SitesGrid) para funcionar corretamente em 375px e acima.

**Architecture:** Ajustes cirúrgicos de classes Tailwind CSS — sem alterar estrutura de componentes, lógica ou design visual. Cada tarefa modifica um arquivo por vez e termina com commit.

**Tech Stack:** Next.js App Router, Tailwind CSS, TypeScript

---

## Arquivos modificados

| Arquivo | Tipo |
|---------|------|
| `app/page.tsx` | Modify |
| `components/sections/SitesGrid.tsx` | Modify |
| `app/(public)/products/page.tsx` | Modify |
| `app/(public)/products/[slug]/page.tsx` | Modify |

---

### Task 1: Hero da landing page — heading e stats

**Files:**
- Modify: `app/page.tsx` (linha 193 e 242)

- [ ] **Step 1: Corrigir o heading h1 do hero**

Em `app/page.tsx`, linha 193, substituir:
```tsx
            <h1 className="text-6xl md:text-7xl xl:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
```
Por:
```tsx
            <h1 className="text-4xl sm:text-5xl md:text-7xl xl:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
```

- [ ] **Step 2: Corrigir os stats do hero para não estourar em mobile**

Em `app/page.tsx`, linha 242, substituir:
```tsx
            <div
              className="flex items-center gap-8 animate-fade-up"
              style={{ animationDelay: '900ms' }}
            >
```
Por:
```tsx
            <div
              className="flex flex-wrap items-center gap-6 animate-fade-up"
              style={{ animationDelay: '900ms' }}
            >
```

- [ ] **Step 3: Verificar visualmente em 375px**

Iniciar o servidor se não estiver rodando:
```bash
npm run dev
```
Abrir Chrome DevTools → Toggle device toolbar → definir 375px de largura → navegar para `http://localhost:3000` → confirmar que o heading "Seu site no ar em 14 dias." não está cortado e os três stats cabem na tela.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "fix: heading e stats do hero responsivos em mobile"
```

---

### Task 2: Landing page — padding das seções

**Files:**
- Modify: `app/page.tsx` (seções vantagens, sites, como-funciona, avaliacoes, sobre, equipe, CTA)

O `py-32 px-6` em todas as seções produz 128px de espaçamento vertical em mobile, excessivo para 375px. A regra é `py-16 sm:py-24 lg:py-32 px-4 sm:px-6`.

- [ ] **Step 1: Seção "vantagens" (bento)**

Em `app/page.tsx`, substituir:
```tsx
      <section id="vantagens" className="py-32 px-6">
```
Por:
```tsx
      <section id="vantagens" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
```

- [ ] **Step 2: Seção "sites"**

Substituir:
```tsx
      <section id="sites" className="py-32 px-6 border-t border-white/5">
```
Por:
```tsx
      <section id="sites" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
```

- [ ] **Step 3: Seção "como-funciona"**

Substituir:
```tsx
      <section id="como-funciona" className="py-32 px-6 border-t border-white/5">
```
Por:
```tsx
      <section id="como-funciona" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
```

- [ ] **Step 4: Seção "avaliacoes"**

Substituir:
```tsx
      <section id="avaliacoes" className="py-32 px-6 border-t border-white/5">
```
Por:
```tsx
      <section id="avaliacoes" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
```

- [ ] **Step 5: Seção "sobre"**

Substituir:
```tsx
      <section id="sobre" className="py-32 px-6 border-t border-white/5">
```
Por:
```tsx
      <section id="sobre" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
```

- [ ] **Step 6: Seção "equipe"**

Substituir:
```tsx
      <section id="equipe" className="py-32 px-6 border-t border-white/5">
```
Por:
```tsx
      <section id="equipe" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
```

- [ ] **Step 7: Seção CTA final (a seção wrapper)**

Substituir:
```tsx
      <section className="py-32 px-6">
```
Por:
```tsx
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
```

- [ ] **Step 8: Verificar visualmente**

Em DevTools a 375px, rolar toda a página e confirmar que o espaçamento entre seções está equilibrado (não excessivo, não colado).

- [ ] **Step 9: Commit**

```bash
git add app/page.tsx
git commit -m "fix: padding de seção responsivo em toda a landing page"
```

---

### Task 3: Landing page — tipografia, cards e CTA

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: h2 da seção "vantagens"**

Substituir:
```tsx
            <h2 className="text-4xl md:text-5xl font-bold text-white max-w-2xl mx-auto">
```
Por:
```tsx
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white max-w-2xl mx-auto">
```

- [ ] **Step 2: h2 da seção "como funciona"**

Substituir:
```tsx
          <h2 className="text-4xl md:text-5xl font-bold text-white">Do zero ao ar em 4 passos</h2>
```
Por:
```tsx
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Do zero ao ar em 4 passos</h2>
```

- [ ] **Step 3: h2 da seção "avaliacoes"**

Substituir:
```tsx
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              O que nossos clientes dizem
            </h2>
```
Por:
```tsx
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              O que nossos clientes dizem
            </h2>
```

- [ ] **Step 4: h2 da seção "sobre"**

Substituir:
```tsx
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
```
Por:
```tsx
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
```

- [ ] **Step 5: h2 da seção "equipe"**

Substituir:
```tsx
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Pessoas reais por trás de cada projeto
            </h2>
```
Por:
```tsx
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Pessoas reais por trás de cada projeto
            </h2>
```

- [ ] **Step 6: Padding dos cards do bento grid**

Os cinco cards bento usam `p-8`. Substituir cada um por `p-6 lg:p-8`. São 5 ocorrências em sequência:

Substituir (card 1, min-h-[200px]):
```tsx
              <div className="bento-card p-8 h-full min-h-[200px] relative overflow-hidden group">
```
Por:
```tsx
              <div className="bento-card p-6 lg:p-8 h-full min-h-[200px] relative overflow-hidden group">
```

Substituir (card 2, min-h-[200px] group relative):
```tsx
              <div className="bento-card p-8 h-full min-h-[200px] group relative overflow-hidden">
```
Por:
```tsx
              <div className="bento-card p-6 lg:p-8 h-full min-h-[200px] group relative overflow-hidden">
```

Substituir (card 3, min-h-[180px]):
```tsx
              <div className="bento-card p-8 h-full min-h-[180px] group relative overflow-hidden">
                <Radio
```
Por:
```tsx
              <div className="bento-card p-6 lg:p-8 h-full min-h-[180px] group relative overflow-hidden">
                <Radio
```

Substituir (card 4, min-h-[180px] Target):
```tsx
              <div className="bento-card p-8 h-full min-h-[180px] group relative overflow-hidden">
                <Target
```
Por:
```tsx
              <div className="bento-card p-6 lg:p-8 h-full min-h-[180px] group relative overflow-hidden">
                <Target
```

Substituir (card 5, min-h-[180px] ShieldCheck):
```tsx
              <div className="bento-card p-8 h-full min-h-[180px] group relative overflow-hidden">
                <ShieldCheck
```
Por:
```tsx
              <div className="bento-card p-6 lg:p-8 h-full min-h-[180px] group relative overflow-hidden">
                <ShieldCheck
```

- [ ] **Step 7: Padding dos cards de review**

Substituir:
```tsx
                <div className="bento-card p-7 h-full flex flex-col gap-4">
```
Por:
```tsx
                <div className="bento-card p-5 lg:p-7 h-full flex flex-col gap-4">
```

- [ ] **Step 8: Steps "como funciona" — gap e tamanho do ícone**

Substituir:
```tsx
                  <div className="flex gap-8 group">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-dark-card border border-white/5 group-hover:border-brand/20 flex items-center justify-center transition-all duration-300 relative z-10">
```
Por:
```tsx
                  <div className="flex gap-4 sm:gap-8 group">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-dark-card border border-white/5 group-hover:border-brand/20 flex items-center justify-center transition-all duration-300 relative z-10">
```

- [ ] **Step 9: Gap do grid "sobre nós"**

Substituir:
```tsx
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
```
Por:
```tsx
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
```

- [ ] **Step 10: CTA final — padding do card e heading**

Substituir:
```tsx
            <div className="relative p-14 md:p-24 rounded-3xl bg-dark-card border border-white/5 text-center overflow-hidden">
```
Por:
```tsx
            <div className="relative p-8 sm:p-14 md:p-24 rounded-3xl bg-dark-card border border-white/5 text-center overflow-hidden">
```

Substituir:
```tsx
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
```
Por:
```tsx
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
```

- [ ] **Step 11: Verificar visualmente**

Em DevTools a 375px: verificar cards do bento, steps, avaliações e CTA final. Todos devem ter espaçamento interno adequado e texto legível sem overflow.

- [ ] **Step 12: Commit**

```bash
git add app/page.tsx
git commit -m "fix: tipografia, cards e CTA da landing page responsivos"
```

---

### Task 4: SitesGrid — modal responsivo

**Files:**
- Modify: `components/sections/SitesGrid.tsx` (linha 246)

- [ ] **Step 1: Corrigir o modal**

Em `components/sections/SitesGrid.tsx`, substituir:
```tsx
          <div className="relative w-full max-w-md bg-[#111111] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/60 overflow-hidden">
```
Por:
```tsx
          <div className="relative w-full max-w-md mx-4 sm:mx-auto bg-[#111111] border border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 overflow-hidden">
```

- [ ] **Step 2: Verificar visualmente**

Em DevTools a 375px, clicar em "Contratar →" em qualquer card. O modal deve aparecer centralizado com margens laterais visíveis, sem tocar as bordas da tela.

- [ ] **Step 3: Commit**

```bash
git add components/sections/SitesGrid.tsx
git commit -m "fix: modal do SitesGrid responsivo com margem lateral em mobile"
```

---

### Task 5: Catálogo de produtos

**Files:**
- Modify: `app/(public)/products/page.tsx`

- [ ] **Step 1: Padding da página**

Em `app/(public)/products/page.tsx`, substituir:
```tsx
    <div className="pt-24 pb-32 px-6">
```
Por:
```tsx
    <div className="pt-20 sm:pt-24 pb-16 sm:pb-32 px-4 sm:px-6">
```

- [ ] **Step 2: Heading da página**

Substituir:
```tsx
          <h1 className="text-5xl font-bold text-white mb-4">
```
Por:
```tsx
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
```

- [ ] **Step 3: Gap do grid**

Substituir:
```tsx
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```
Por:
```tsx
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

- [ ] **Step 4: Verificar visualmente**

Em DevTools a 375px, navegar para `http://localhost:3000/products`. Os cards devem empilhar em coluna única sem espaçamento excessivo, e o heading deve ser legível.

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/products/page.tsx"
git commit -m "fix: catálogo de produtos responsivo em mobile"
```

---

### Task 6: Detalhe do produto

**Files:**
- Modify: `app/(public)/products/[slug]/page.tsx`

- [ ] **Step 1: Padding da página**

Em `app/(public)/products/[slug]/page.tsx`, substituir:
```tsx
    <div className="pt-24 pb-32 px-6">
```
Por:
```tsx
    <div className="pt-20 sm:pt-24 pb-16 sm:pb-32 px-4 sm:px-6">
```

- [ ] **Step 2: Gap do grid principal**

Substituir:
```tsx
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
```
Por:
```tsx
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
```

- [ ] **Step 3: Sticky apenas em desktop**

Substituir:
```tsx
          <div className="sticky top-28">
```
Por:
```tsx
          <div className="lg:sticky lg:top-28">
```

- [ ] **Step 4: Heading do produto**

Substituir:
```tsx
            <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
```
Por:
```tsx
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{product.name}</h1>
```

- [ ] **Step 5: Verificar visualmente**

Em DevTools a 375px, navegar para `http://localhost:3000/products/agency-pro`. O layout deve exibir a imagem primeiro, depois os detalhes, sem sticky no mobile. O heading e preço devem caber sem overflow.

- [ ] **Step 6: Commit**

```bash
git add "app/(public)/products/[slug]/page.tsx"
git commit -m "fix: página de detalhe do produto responsiva em mobile"
```

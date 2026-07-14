# HANDOFF — Cálculo Tornado Fácil (PT-BR)

## Status
**Tradução completa** do livro (prólogo, caps. I–XXI, 14b, epílogo, tabela).

**Features de ebook** implementadas e revisadas:
- Resume de leitura, TOC lateral, busca full-text, bookmarks, export MD/JSON, glossário, teclado, modo foco
- Marca-texto (cores, lista, filtro, notas), tema/fonte/tamanho, progress bar, limpar cache
- Fixes pós-revisão: race de resume no load, openDrawer fecha painéis, FAB no foco, searchWaiters, restore de scroll do bookmark, índice de busca limpo (sem Jinja)

**Revisão de tradução 100%** (1ª + 2ª passagem, eu + subagentes tipo AGY):
- Patches alta/média aplicados (gramática, calques, LaTeX `gathered[t]`, `x&=6`, poor-rate, 1/ε, ics→xis, etc.)
- Paridade de exercícios/fórmulas/imagens EN×PT verificada

## Publicação
- Site: https://rodriguestmo.github.io/calculo-tornado-facil/
- Repo: https://github.com/Rodriguestmo/calculo-tornado-facil
- Deploy: branch `gh-pages` (conteúdo de `public/`), autor git `Rodriguestmo` / e-mail `rodriguestmo@gmail.com`
- Local: `python3 -m http.server 8765 --directory public --bind 127.0.0.1`

## Fluxo
1. Editar `templates/`
2. `python3 compile_templates.py` (regenerar `templates/j/search-index.json` se o texto do livro mudar)
3. Publicar `public/` em `gh-pages` com e-mail `rodriguestmo@gmail.com`
4. **Sem commit sem aprovação explícita**

## Pendências
- [x] Deploy em GitHub Pages (commit `f629b3c`, Actions success 2026-07-14)
- [ ] Polimento residual opcional (baixa prioridade): unificar `Fig.`/`Figura`, capitalização do título V no sumário

## Atualização
2026-07-14 — publicado em https://rodriguestmo.github.io/calculo-tornado-facil/ (features + revisão 100% da tradução; commit f629b3c).

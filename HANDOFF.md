# HANDOFF — Cálculo Tornado Fácil (PT-BR)

## O que é
Tradução para português brasileiro do livro *Calculus Made Easy* (Silvanus P. Thompson, 1910), com base no HTML de https://github.com/nadvornix/calculus-made-easy (domínio público via Project Gutenberg).

## Fluxo de trabalho
1. Grok traduz um capítulo (templates/*.html)
2. AGY revisa comparando `templates-en/` (original) com `templates/` (PT)
3. Correções aplicadas se necessário
4. Capítulos certificados ficam listados abaixo

## Status
| Arquivo | Status | Notas |
|---------|--------|-------|
| prologue.html | CERTIFICADO (AGY) | piloto ok |
| 1.html | CERTIFICADO (AGY) | piloto ok |
| 2–21, epilogue, table, index | pendente | |

## Revisão AGY do piloto (2026-07-14)
- 1ª passagem: RESSALVAS (master, textbooks, chokes off, doravante)
- Correções aplicadas; travessão longo rejeitado (padrão do projeto: hífen)
- 2ª passagem: **CERTIFICADO**

## Pastas
- `templates/` — versão PT-BR (em progresso)
- `templates-en/` — cópias do original em inglês (referência para revisão)
- `public/` — saída compilada (site estático)

## Como compilar
```bash
cd ~/Documents/Trabalho/Pessoal/calculus-made-easy-pt
python3 -m venv myenv && source myenv/bin/activate
pip install -r requirements.txt
python3 compile_templates.py
# servir: python3 -m http.server 8080 --directory public
```

## Notas de Gardner + tema
- Referência: PDF local `[Thompson,Gardner]Calculus Made Easy(1998).pdf`
- Modos (`localStorage: cme-notes-mode`):
  - `all` = todas as notas sempre visíveis
  - `click` = lupa SVG; clique abre/fecha a nota abaixo (padrão)
- Tema (`localStorage: cme-theme`): `light` | `dark`
- CSS: `.gardner-note`, `.note-mark`, `html.notes-mode-*`, `html.theme-dark`
- JS: `templates/j/notes-toggle.js`
- Copyright: texto Thompson PD; notas Gardner © 1998 (uso local de estudo)

## Servidor local
```bash
cd ~/Documents/Trabalho/Pessoal/calculus-made-easy-pt
source myenv/bin/activate
python3 compile_templates.py
python3 -m http.server 8765 --directory public
```
- Home: http://127.0.0.1:8765/
- Prólogo: http://127.0.0.1:8765/prologue.html
- Cap. I: http://127.0.0.1:8765/1.html

## Atualização
2026-07-14 — piloto PT certificado; notas Gardner com toggle; site no localhost:8765.

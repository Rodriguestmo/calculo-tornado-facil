/* Configuração MathJax 2 – carregar ANTES de MathJax.js */
MathJax.Hub.Config({
  tex2jax: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true,
    skipTags: ["script", "noscript", "style", "textarea", "pre", "code"]
  },
  TeX: {
    extensions: ["AMSmath.js", "AMSsymbols.js"],
    equationNumbers: { autoNumber: "none" },
    Macros: {
      // atalhos se precisar no futuro
    }
  },
  "HTML-CSS": {
    availableFonts: ["TeX"],
    linebreaks: { automatic: false },
    styles: {
      ".MathJax_Display": {
        margin: "1.5em 0"
      }
    },
    scale: 100
  },
  CommonHTML: {
    scale: 100,
    styles: {
      ".MJXc-display": { margin: "1.5em 0" }
    }
  },
  showProcessingMessages: false,
  messageStyle: "none"
});

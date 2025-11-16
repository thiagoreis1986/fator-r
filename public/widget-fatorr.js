(function () {
  // ============================================
  // ORIGEM DA CALCULADORA EM PRODUÇÃO (VERCEL)
  // ============================================
  // 👉 Troque essa URL pela URL do seu projeto no Vercel.
  // Exemplo: "https://fatorr-contaagil.vercel.app"
  var ORIGIN = "https://fator-r.vercel.app/";

  // Cria o widget dentro de um container
  function createWidget(container) {
    if (!container) return;

    // Altura configurável pelo atributo data-fatorr-height
    var height =
      container.getAttribute("data-fatorr-height") || "900px";

    var iframe = document.createElement("iframe");
    iframe.src = ORIGIN + "/"; // carrega a calculadora
    iframe.style.width = "100%";
    iframe.style.height = height;
    iframe.style.border = "0";
    iframe.style.borderRadius = "24px";
    iframe.style.overflow = "hidden";
    iframe.loading = "lazy";

    container.appendChild(iframe);
  }

  // Procura todos os elementos com data-fatorr-widget
  function initAll() {
    var nodes = document.querySelectorAll("[data-fatorr-widget]");
    if (!nodes || !nodes.length) return;

    if (nodes.forEach) {
      nodes.forEach(createWidget);
    } else {
      Array.prototype.forEach.call(nodes, createWidget);
    }
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // API global opcional (caso algum site queira chamar manualmente)
  window.FatorRWidget = {
    init: initAll,
    create: createWidget,
  };
})();

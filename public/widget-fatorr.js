(function () {
  // ============================================
  // ENDEREÇO FINAL (VERCEL)
  // ============================================
  var ORIGIN = "https://fator-r.vercel.app";

  // Cria o widget dentro de um container
  function createWidget(container) {
    if (!container) return;

    // Altura configurável pelo atributo data-fatorr-height
    var height = container.getAttribute("data-fatorr-height") || "950px";

    var iframe = document.createElement("iframe");
    iframe.src = ORIGIN; // carrega a calculadora
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
    if (!nodes.length) return;

    nodes.forEach(createWidget);
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // API global opcional (caso queira chamar manualmente)
  window.FatorRWidget = {
    init: initAll,
    create: createWidget,
  };
})();

(function () {
  // ============================================
  // ENDEREÇO FINAL (VERCEL)
  // ============================================
  var ORIGIN = "https://fator-r.vercel.app";

  // Guardamos os iframes criados para poder ajustar o correto
  var iframes = [];

  // Cria o widget dentro de um container
  function createWidget(container) {
    if (!container) return;

    // Altura mínima configurável (para evitar ficar esmagado)
    var minHeightAttr = container.getAttribute("data-fatorr-height");
    var minHeight = parseInt(minHeightAttr || "700", 10);

    var iframe = document.createElement("iframe");
    // carrega a calculadora já em modo embed
    iframe.src = ORIGIN + "/?embed=1";
    iframe.style.width = "100%";
    iframe.style.height = minHeight + "px"; // altura inicial
    iframe.style.border = "0";
    iframe.style.borderRadius = "24px";
    iframe.style.overflow = "hidden";
    iframe.loading = "lazy";

    container.appendChild(iframe);
    iframes.push({ iframe: iframe, minHeight: minHeight });
  }

  // Procura todos os elementos com data-fatorr-widget
  function initAll() {
    var nodes = document.querySelectorAll("[data-fatorr-widget]");
    if (!nodes.length) return;

    if (nodes.forEach) {
      nodes.forEach(createWidget);
    } else {
      Array.prototype.forEach.call(nodes, createWidget);
    }
  }

  // Ouve mensagens de resize vindas do iframe
  window.addEventListener("message", function (event) {
    // apenas mensagens que vierem do seu domínio do Vercel
    if (event.origin !== ORIGIN) return;

    var data = event.data || {};
    if (data.type !== "fatorr-resize") return;

    var newHeight = parseInt(data.height, 10);
    if (!newHeight || newHeight <= 0) return;

    // descobre qual iframe enviou essa mensagem
    for (var i = 0; i < iframes.length; i++) {
      var item = iframes[i];
      if (item.iframe.contentWindow === event.source) {
        var finalHeight = Math.max(item.minHeight, newHeight);
        item.iframe.style.height = finalHeight + "px";
        break;
      }
    }
  });

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // API global opcional
  window.FatorRWidget = {
    init: initAll,
    create: createWidget,
  };
})();

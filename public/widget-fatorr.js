(function () {
  // Descobre a origem do script automaticamente:
  // se o script estiver em https://site.com/widget-fatorr.js
  // a ORIGIN será "https://site.com"
  var scriptSrc =
    document.currentScript && document.currentScript.src
      ? document.currentScript.src
      : "";
  var origin = scriptSrc.replace(/\/[^\/]*$/, "");

  // Cria um widget dentro de um container
  function createWidget(container) {
    if (!container) return;

    // Permite configurar altura via atributo data-fatorr-height
    var height =
      container.getAttribute("data-fatorr-height") || "900px";

    var iframe = document.createElement("iframe");
    iframe.src = origin + "/"; // carrega a calculadora na raiz do app
    iframe.style.width = "100%";
    iframe.style.height = height;
    iframe.style.border = "0";
    iframe.style.borderRadius = "24px";
    iframe.style.overflow = "hidden";
    iframe.loading = "lazy";

    container.appendChild(iframe);
  }

  // Procura todos os containers marcados com data-fatorr-widget
  function initAll() {
    var nodes = document.querySelectorAll("[data-fatorr-widget]");
    if (!nodes || !nodes.length) return;
    nodes.forEach
      ? nodes.forEach(createWidget)
      : Array.prototype.forEach.call(nodes, createWidget);
  }

  // Inicializa automaticamente quando a página carregar
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // Expondo uma API global opcional
  window.FatorRWidget = {
    init: initAll,
    create: createWidget,
  };
})();

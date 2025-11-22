import { useState, useEffect, useRef } from "react";

/* Util: converte "R$ 10.000,00" -> 10000 */
function parseCurrencyToNumber(value) {
  if (!value) return 0;

  return (
    parseFloat(
      value
        .toString()
        .replace(/[^\d,]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0
  );
}

/* Util: formata número em BRL para exibição no resultado */
function formatCurrencyBRL(value) {
  if (isNaN(value)) return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function FatorRCalculator() {
  const [simples, setSimples] = useState(null);
  const [atividade, setAtividade] = useState("");
  const [tempo, setTempo] = useState(""); // "mais12" | "menos12"
  const [mesesEmpresa, setMesesEmpresa] = useState("");

  const [faturamentoMensal, setFaturamentoMensal] = useState("");
  const [faturamentoAnual, setFaturamentoAnual] = useState("");

  const [temProlabore, setTemProlabore] = useState(null);
  const [valorProlabore, setValorProlabore] = useState("");

  const [temFuncionarios, setTemFuncionarios] = useState(null);
  const [folhaMensal, setFolhaMensal] = useState("");

  const [alert, setAlert] = useState(null);
  const [resultado, setResultado] = useState(null);

  // 🔽 refs para controle de foco
  const atividadeRef = useRef(null);
  const mesesEmpresaRef = useRef(null);
  const faturamentoMensalRef = useRef(null);

  const prolaboreRef = useRef(null);
  const folhaMensalRef = useRef(null);

  const resultadoRef = useRef(null);

  // Quando simples === false, bloqueia toda a calculadora
  const bloqueado = simples === false;
  
    const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlHasEmbed = params.get("embed") === "1";
      const inIframe = window !== window.parent;

      if (urlHasEmbed || inIframe) {
        setIsEmbed(true);
      }
    } catch (e) {
      // se der qualquer erro, segue sem modo embed
    }
  }, []);

    // 🔄 Ajuste automático de altura quando estiver em iframe (embed)
  useEffect(() => {
    if (window === window.parent) return; // não está em iframe

    function postHeight() {
      try {
        const docEl = document.documentElement;
        const body = document.body;

        const height = Math.max(
          docEl.scrollHeight,
          docEl.offsetHeight,
          body ? body.scrollHeight : 0,
          body ? body.offsetHeight : 0
        );

        window.parent.postMessage(
          { type: "fatorr-resize", height },
          "*" // o widget filtra pelo origin
        );
      } catch (e) {
        // silencioso
      }
    }

    // dispara logo ao carregar
    postHeight();

    // dispara se a janela for redimensionada
    window.addEventListener("resize", postHeight);

    // observa mudanças de conteúdo
    let observer = null;
    if (window.ResizeObserver && document.body) {
      observer = new ResizeObserver(postHeight);
      observer.observe(document.body);
    }

    return () => {
      window.removeEventListener("resize", postHeight);
      if (observer) observer.disconnect();
    };
  }, []);


  // Controla ESC e bloqueio de scroll quando o modal está aberto
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && simples === false) {
        setSimples(null);
      }
    }

    window.addEventListener("keydown", onKey);

    // trava scroll (fallback caso :has() não funcione)
    if (simples === false) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [simples]);

  function resetFeedback() {
    setAlert(null);
    setResultado(null);
  }

  function limparTudo() {
    setSimples(null);
    setAtividade("");
    setTempo("");
    setMesesEmpresa("");
    setFaturamentoMensal("");
    setFaturamentoAnual("");
    setTemProlabore(null);
    setValorProlabore("");
    setTemFuncionarios(null);
    setFolhaMensal("");
    setAlert(null);
    setResultado(null);
  }

  // Máscara de moeda enquanto digita
  function handleCurrencyChange(e, setter) {
    const input = e.target;
    let value = input.value;

    // salva a posição original do cursor
    const oldCursor = input.selectionStart;

    // remove tudo que não for número, vírgula ou ponto
    let cleaned = value.replace(/[^\d.,]/g, "");

    // Se tiver ponto, troca por vírgula — mantém padrão PT-BR
    cleaned = cleaned.replace(/\./g, ",");

    // se houver MAIS DE UMA vírgula → mantém só a primeira
    const parts = cleaned.split(",");
    if (parts.length > 2) {
      cleaned = parts[0] + "," + parts.slice(1).join("").replace(/,/g, "");
    }

    // remove zeros à esquerda do inteiro, preservando se for "0,xx"
    if (cleaned !== "" && !cleaned.startsWith("0,")) {
      cleaned = cleaned.replace(/^0+(?=\d)/, "");
    }

    // agora remove tudo que não for dígito para montar número puro
    const digits = cleaned.replace(/\D/g, "");

    if (!digits) {
      setter("");
      return;
    }

    // número real
    const number = Number(digits) / 100;

    // formatação PT-BR
    const formatted = number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setter(formatted);

    // recoloca o cursor corretamente
    setTimeout(() => {
      const diff = formatted.length - value.length;
      const newPos = Math.max(oldCursor + diff, 0);
      input.setSelectionRange(newPos, newPos);
    }, 0);

    resetFeedback();
  }

  function calcular(e) {
    e.preventDefault();
    setAlert(null);
    setResultado(null);

    // Só calcula se for Simples Nacional
    if (simples !== true) {
      setAlert({
        type: "warning",
        title: "Fator R é exclusivo para empresas do Simples Nacional",
        message:
          "Confirme se a empresa é optante pelo Simples Nacional antes de utilizar esta calculadora.",
      });
      return;
    }

    if (!atividade.trim()) {
      setAlert({
        type: "warning",
        title: "Informe a atividade da empresa",
        message:
          "Escreva a área de atuação do seu negócio para seguirmos com o cálculo.",
      });
      return;
    }

    if (!tempo) {
      setAlert({
        type: "warning",
        title: "Informe o tempo de funcionamento",
        message:
          "Selecione há quanto tempo sua empresa está em funcionamento.",
      });
      return;
    }

    let receita12 = 0;

    // Empresa com mais de 12 meses
    if (tempo === "mais12") {
      const mensal = parseCurrencyToNumber(faturamentoMensal);

      if (mensal <= 0 && !faturamentoAnual) {
        setAlert({
          type: "warning",
          title: "Faturamento bruto mensal inválido",
          message:
            "Informe o faturamento bruto mensal ou o total dos últimos 12 meses.",
        });
        return;
      }

      if (faturamentoAnual) {
        const anual = parseCurrencyToNumber(faturamentoAnual);
        if (anual > 0) receita12 = anual;
      }

      if (receita12 <= 0 && mensal > 0) {
        receita12 = mensal * 12;
      }
    }

    // Empresa com menos de 12 meses: projeta
    if (tempo === "menos12") {
      const meses = Number(mesesEmpresa);
      const mensal = parseCurrencyToNumber(faturamentoMensal);

      if (!meses || meses < 1 || meses > 11) {
        setAlert({
          type: "warning",
          title: "Meses de funcionamento inválidos",
          message: "Informe um número de meses entre 1 e 11.",
        });
        return;
      }

      if (mensal <= 0) {
        setAlert({
          type: "warning",
          title: "Faturamento bruto mensal inválido",
          message:
            "Informe o faturamento bruto mensal para que possamos projetar o ano.",
        });
        return;
      }

      // projeção simples: usa o mensal informado * 12
      receita12 = mensal * 12;
    }

    if (receita12 <= 0) {
      setAlert({
        type: "warning",
        title: "Faturamento não informado",
        message:
          "Revise os campos de faturamento mensal/anual antes de continuar.",
      });
      return;
    }

    if (temProlabore === null || temFuncionarios === null) {
      setAlert({
        type: "warning",
        title: "Responda sobre pró-labore e funcionários",
        message:
          "Informe se os sócios recebem pró-labore e se a empresa possui funcionários CLT/estagiários.",
      });
      return;
    }

    // Se marcou "Sim", converte e valida; se marcou "Não", trata como zero
    const prolabore = temProlabore
      ? parseCurrencyToNumber(valorProlabore)
      : 0;

    const folha = temFuncionarios
      ? parseCurrencyToNumber(folhaMensal)
      : 0;

    if (temProlabore && prolabore <= 0) {
      setAlert({
        type: "warning",
        title: "Pró-labore inválido",
        message:
          "Informe o valor mensal total de pró-labore dos sócios (antes do INSS).",
      });
      return;
    }

    if (temFuncionarios && folha <= 0) {
      setAlert({
        type: "warning",
        title: "Folha de pagamento inválida",
        message:
          "Informe o custo mensal total com funcionários (salários + encargos).",
      });
      return;
    }

    const folha12 = (prolabore + folha) * 12;

    // 🔹 AQUI ESTAVA O PROBLEMA:
    // Antes bloqueava quando folha12 <= 0, o que é errado para quem marcou "Não" nos dois.
    // Agora permitimos folha12 = 0 (Fator R = 0%) como caso válido.

    const fatorR = folha12 / receita12;
    const fatorRPercent = fatorR * 100;

    const aliquotaAnexo3 = 0.06; // 6%
    const aliquotaAnexo5 = 0.155; // 15,5%

    const impostoAnexo3 = receita12 * aliquotaAnexo3;
    const impostoAnexo5 = receita12 * aliquotaAnexo5;

    const usarAnexo3 = fatorR >= 0.28;

    const anexoRecomendado = usarAnexo3 ? "III" : "V";
    const aliquotaRecomendada = usarAnexo3
      ? aliquotaAnexo3
      : aliquotaAnexo5;
    const aliquotaAlternativa = usarAnexo3
      ? aliquotaAnexo5
      : aliquotaAnexo3;
    const impostoRecomendado = usarAnexo3
      ? impostoAnexo3
      : impostoAnexo5;
    const impostoAlternativo = usarAnexo3
      ? impostoAnexo5
      : impostoAnexo3;

    const folhaPercent = (folha12 / receita12) * 100;
    const impostosPercent = (impostoRecomendado / receita12) * 100;
    const rendaPercent = Math.max(
      0,
      100 - folhaPercent - impostosPercent
    );

    if (
      !isFinite(folhaPercent) ||
      !isFinite(impostosPercent) ||
      folhaPercent < 0 ||
      impostosPercent < 0
    ) {
      setAlert({
        type: "warning",
        title: "Não foi possível montar o resultado",
        message:
          "Revise os valores de faturamento e custos com pessoal e tente novamente.",
      });
      return;
    }

        setResultado({
      fatorRPercent,
      folha12,
      receita12,
      anexoRecomendado,
      aliquotaRecomendada,
      aliquotaAlternativa,
      impostoRecomendado,
      impostoAlternativo,
      folhaPercent,
      impostosPercent,
      rendaPercent,
      mensagem: usarAnexo3
        ? "Com Fator R igual ou superior a 28%, a tributação tende a ser pelo Anexo III, geralmente mais vantajoso para serviços."
        : "Com Fator R abaixo de 28%, a tributação tende a ser pelo Anexo V. É importante revisar pró-labore e folha com um especialista.",
    });

    // 🔽 Após montar o resultado, rola suavemente até a área de resultado
    setTimeout(() => {
      if (resultadoRef.current) {
        resultadoRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 0);
  }
  return (
    <>
      {/* Modal de aviso quando NÃO é Simples */}
      {simples === false && (
        <div
          className="fr-modal-overlay fr-modal-open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-simples-title"
          aria-describedby="modal-simples-desc"
          onClick={(e) => {
            // fecha ao clicar fora do card
            if (e.target.classList.contains("fr-modal-overlay")) {
              setSimples(null);
            }
          }}
        >
          <div className="fr-modal-card" tabIndex={-1}>
            <button
              className="fr-modal-x"
              type="button"
              aria-label="Fechar aviso"
              onClick={() => setSimples(null)}
            >
              ×
            </button>

            <h3 id="modal-simples-title" className="fr-modal-title">
              OPS, ATENÇÃO!
            </h3>

            <p id="modal-simples-desc" className="fr-modal-text">
              <strong>O cálculo do Fator R só vale para empresas que estão</strong>
              <br />
              <strong>no Simples Nacional.</strong>
            </p>
            <p className="fr-modal-text">
              Se a sua empresa não opta por esse regime, não se preocupe:
              <br />
              você pode avaliar outras formas de planejamento tributário para
              <br />
              o seu negócio chamando a gente!
            </p>

            <div className="fr-modal-actions">
              <button
                type="button"
                className="fr-btn-primary"
                onClick={() => setSimples(null)}
              >
                ENTENDI
              </button>
            </div>
          </div>
        </div>
      )}

            <div className={`fr-layout ${isEmbed ? "fr-embed" : ""}`}>

        {/* Coluna azul */}
        <aside className="fr-sidebar">
          <h1 className="fr-sidebar-title">
            CALCULADORA
            <br />
            FATOR R
          </h1>
          <p>
            Calcule em instantes o Fator R da sua empresa e descubra se a
            tributação será pelo Anexo III ou V do Simples Nacional. Com nossa
            análise, você consegue planejar melhor seus impostos e encontrar
            oportunidades reais de economia para o seu negócio.
          </p>
        </aside>

        {/* Card branco */}
        <main className="fr-content">
          <div className="fr-card">
          <h2 className="fr-title">CALCULADORA FATOR R</h2>

            <form className="fr-form" onSubmit={calcular}>
              {/* Simples Nacional */}
              <section className="fr-question">
                <h3 className="fr-label">
                  Sua empresa opta pelo Simples Nacional?
                  <span className="fr-help" aria-describedby="hint-simples">
                    <span className="fr-help-icon">?</span>
                    <span
                      id="hint-simples"
                      className="fr-help-bubble"
                      role="tooltip"
                    >
                      Selecione <strong>“Sim”</strong> apenas se sua empresa
                      estiver formalmente enquadrada no regime do{" "}
                      <strong>Simples Nacional</strong> junto à Receita
                      Federal. Essa calculadora é exclusiva para empresas
                      optantes por esse regime.
                    </span>
                  </span>
                </h3>

                <div className="fr-options-row">
                  <label className="fr-option">
                    <input
                      type="radio"
                      name="simples"
                      checked={simples === true}
                      onChange={() => {
                        setSimples(true);
                        setAlert(null);
                        setResultado(null);
                        // foca na atividade e rola até ela (desktop + mobile)
                        setTimeout(() => {
                          if (atividadeRef.current) {
                            atividadeRef.current.focus();
                            atividadeRef.current.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                        }, 0);
                      }}
                    />
                    Sim
                  </label>
                  <label className="fr-option">
                    <input
                      type="radio"
                      name="simples"
                      checked={simples === false}
                      onChange={() => {
                        setSimples(false);
                        resetFeedback();
                      }}
                    />
                    Não
                  </label>
                </div>
              </section>

              {/* Tudo abaixo fica desabilitado se marcar "Não" */}
              <fieldset
                disabled={bloqueado}
                className={bloqueado ? "fr-disabled" : ""}
              >
                {/* Atividade */}
                <section className="fr-question">
                  <h3 className="fr-label">
                    Qual a atividade da sua empresa?
                    <span
                      className="fr-help"
                      aria-describedby="hint-atividade"
                    >
                      <span className="fr-help-icon">?</span>
                      <span
                        id="hint-atividade"
                        className="fr-help-bubble"
                        role="tooltip"
                      >
                        Informe a atividade principal (CNAE) ou descreva
                        sucintamente o serviço principal. Isso ajuda a orientar
                        o enquadramento.
                      </span>
                    </span>
                  </h3>

                  <input
                    className="fr-input"
                    ref={atividadeRef}
                    value={atividade}
                    onChange={(e) => {
                      setAtividade(e.target.value);
                      resetFeedback();
                    }}
                    placeholder="Escreva a área de atuação do seu negócio!"
                  />
                </section>

                {/* Tempo de funcionamento */}
                <section className="fr-question">
                  <h3 className="fr-label fr-label-nowrap">
                    Há quanto tempo sua empresa está em funcionamento?
                      <span className="fr-help" aria-describedby="hint-tempo">
                      <span className="fr-help-icon">?</span>
                      <span
                        id="hint-tempo"
                        className="fr-help-bubble"
                        role="tooltip"
                      >
                        Escolha <strong>“Mais de 12 meses”</strong> se a empresa já completou
                        1 ano de atividade (ou seja, já possui histórico anual completo).<br /><br />
                        Escolha <strong>“Menos de 12 meses”</strong> se ainda está em operação
                        há menos de 1 ano.
                      </span>
                    </span>
                  </h3>

                  <div className="fr-options-row">
                    <label className="fr-option">
                      <input
                        type="radio"
                        name="tempo"
                        checked={tempo === "mais12"}
                        onChange={() => {
                          setTempo("mais12");
                          setMesesEmpresa("");
                          resetFeedback();
                          setTimeout(() => {
                            if (faturamentoMensalRef.current) {
                              faturamentoMensalRef.current.focus();
                              faturamentoMensalRef.current.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }
                          }, 0);
                        }}
                      />
                      Mais de 12 meses
                    </label>

                    <label className="fr-option">
                      <input
                        type="radio"
                        name="tempo"
                        checked={tempo === "menos12"}
                        onChange={() => {
                          setTempo("menos12");
                          resetFeedback();
                          setTimeout(() => {
                            if (faturamentoMensalRef.current) {
                              faturamentoMensalRef.current.focus();
                              faturamentoMensalRef.current.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }
                          }, 0);
                        }}
                      />
                      Menos de 12 meses
                    </label>
                  </div>
                </section>

                {/* Meses de funcionamento (para menos de 12) */}
                {tempo === "menos12" && (
                  <section className="fr-question">
                    <h3>Há quantos meses sua empresa está em funcionamento?</h3>
                    <input
                      className="fr-input"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="11"
                      value={mesesEmpresa}
                      onChange={(e) => {
                        setMesesEmpresa(e.target.value);
                        resetFeedback();
                      }}
                      placeholder="Escreva somente numerais. EX.: 0 - 12"
                    />
                  </section>
                )}

                {/* Faturamento mensal */}
                <section className="fr-question">
                  <h3 className="fr-label">
                    Qual o seu faturamento bruto mensal?
                    <span
                      className="fr-help"
                      aria-describedby="hint-faturamento"
                    >
                      <span className="fr-help-icon">?</span>
                      <span
                        id="hint-faturamento"
                        className="fr-help-bubble"
                        role="tooltip"
                      >
                        Informe o valor médio de faturamento bruto mensal da
                        empresa —{" "}
                        <strong>
                          sem deduzir impostos, custos ou despesas
                        </strong>
                        . Se houver variação entre os meses, utilize uma média
                        aproximada.
                      </span>
                    </span>
                  </h3>

                  <input
                    className="fr-input"
                    type="text"
                    inputMode="decimal"
                    ref={faturamentoMensalRef}
                    value={faturamentoMensal}
                    onChange={(e) => {
                      handleCurrencyChange(e, setFaturamentoMensal);

                      if (tempo === "mais12" && faturamentoAnual) {
                        setFaturamentoAnual("");
                      }

                      resetFeedback();
                    }}
                    placeholder="R$ 0,00"
                    disabled={tempo === "mais12" && !!faturamentoAnual}
                  />
                </section>

                {/* Faturamento 12 meses (opcional p/ mais de 12 meses) */}
                {tempo === "mais12" && (
                  <section className="fr-question">
                    <h3>Ou informe o faturamento bruto dos últimos 12 meses:</h3>
                    <input
                      className="fr-input"
                      type="text"
                      inputMode="decimal"
                      value={faturamentoAnual}
                      onChange={(e) => {
                        handleCurrencyChange(e, setFaturamentoAnual);

                        if (faturamentoMensal) {
                          setFaturamentoMensal("");
                        }

                        resetFeedback();
                      }}
                      placeholder="Opcional - R$ 0,00"
                      disabled={!!faturamentoMensal}
                    />
                  </section>
                )}

 {/* Pró-labore */}
<section className="fr-question">
  <h3 className="fr-label">
    Você recebe pró-labore?
    <span className="fr-help" aria-describedby="hint-prolabore">
      <span className="fr-help-icon">?</span>
      <span id="hint-prolabore" className="fr-help-bubble" role="tooltip">
        O <strong>pró-labore</strong> é a remuneração mensal dos sócios que atuam na empresa.
        Deve ser declarado mesmo que não haja retirada formal — e serve como base para
        o cálculo de encargos como <strong>INSS</strong> e <strong>IRPF</strong>.
      </span>
    </span>
  </h3>

  <div className="fr-options-row">
    <label className="fr-option">
      <input
        type="radio"
        name="prolabore"
        checked={temProlabore === true}
        onChange={() => {
          setTemProlabore(true);
          resetFeedback();
          setValorProlabore("");

          setTimeout(() => {
            if (prolaboreRef.current) {
              prolaboreRef.current.focus();
              prolaboreRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 0);
        }}
      />
      Sim
    </label>

    <label className="fr-option">
      <input
        type="radio"
        name="prolabore"
        checked={temProlabore === false}
        onChange={() => {
          setTemProlabore(false);
          setValorProlabore("");
          resetFeedback();
        }}
      />
      Não
    </label>
  </div>

  {temProlabore && (
    <section className="fr-question">
      <h3 className="fr-label">Quanto você recebe de pró-labore mensal?</h3>

      <input
        className="fr-input"
        type="text"
        inputMode="decimal"
        ref={prolaboreRef}
        value={valorProlabore}
        onChange={(e) => handleCurrencyChange(e, setValorProlabore)}
        placeholder="Digite o valor mensal (R$)"
      />
    </section>
  )}
</section>


{/* Funcionários */}
<section className="fr-question">
  <h3 className="fr-label">
    Você possui funcionários?
    <span
      className="fr-help fr-help-right"
      aria-describedby="hint-funcionarios"
    >
      <span className="fr-help-icon">?</span>
      <span
        id="hint-funcionarios"
        className="fr-help-bubble fr-help-bubble-right"
        role="tooltip"
      >
        Inclua todos os colaboradores com vínculo CLT, estagiários ou
        autônomos pagos mensalmente. Use o custo total da folha:
        salários + encargos sociais (INSS, FGTS, etc.).
      </span>
    </span>
  </h3>

  <div className="fr-options-row">
    <label className="fr-option">
      <input
        type="radio"
        name="funcionarios"
        checked={temFuncionarios === true}
        onChange={() => {
          setTemFuncionarios(true);
          resetFeedback();
          setFolhaMensal("");

          setTimeout(() => {
            if (folhaMensalRef.current) {
              folhaMensalRef.current.focus();
              folhaMensalRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 0);
        }}
      />
      Sim
    </label>

    <label className="fr-option">
      <input
        type="radio"
        name="funcionarios"
        checked={temFuncionarios === false}
        onChange={() => {
          setTemFuncionarios(false);
          setFolhaMensal("");
          resetFeedback();
        }}
      />
      Não
    </label>
  </div>

  {temFuncionarios && (
    <section className="fr-question">
      <h3 className="fr-label">
        Qual o seu gasto médio com folha de pagamento mensal, incluindo impostos?
      </h3>

      <input
        className="fr-input"
        type="text"
        inputMode="decimal"
        ref={folhaMensalRef}
        value={folhaMensal}
        onChange={(e) => handleCurrencyChange(e, setFolhaMensal)}
        placeholder="Digite o gasto mensal com folha (R$)"
      />
    </section>
  )}
</section>

              </fieldset>

              {/* Alertas */}
              {alert && (
                <div
                  className={
                    "fr-alert " +
                    (alert.type === "warning"
                      ? "fr-alert-warning"
                      : "fr-alert-info")
                  }
                >
                  <strong>{alert.title}</strong>
                  <div>{alert.message}</div>
                </div>
              )}

              {/* Botões principais */}
              <div className="fr-actions">
                <button type="submit" className="fr-btn-primary">
                  CALCULAR MEU FATOR R
                </button>
                <button
                  type="button"
                  className="fr-btn-outline"
                  onClick={limparTudo}
                >
                  LIMPAR
                </button>
              </div>
            </form>

            {/* Resultado */}
            {resultado && (
              <section className="fr-result" ref={resultadoRef}>
                <h2 className="fr-result-title">
                  SEU NEGÓCIO SE ENQUADRA NO ANEXO{" "}
                  {resultado.anexoRecomendado}
                </h2>

                <p className="fr-result-text">
                  Isso significa que a sua carga de impostos pode ser mais{" "}
                  {resultado.anexoRecomendado === "III" ? "leve" : "elevada"},
                  impactando diretamente o crescimento do negócio. Utilize estes
                  números como base para avaliar, junto com a Conta Ágil, o
                  melhor planejamento tributário.
                </p>

                {/* Gráfico de barras horizontais */}
                <div className="fr-bars">
                  <div className="fr-bar-label">
                    Anexo {resultado.anexoRecomendado}
                  </div>
                  <div className="fr-bar-track">
                    <div
                      className="fr-bar-fill fr-bar-fill-main"
                      style={{
                        width: `${
                          (resultado.aliquotaRecomendada /
                            Math.max(
                              resultado.aliquotaRecomendada,
                              resultado.aliquotaAlternativa
                            )) * 100
                        }%`,
                      }}
                    >
                      {(resultado.aliquotaRecomendada * 100).toFixed(2)}%
                    </div>
                  </div>

                  <div className="fr-bar-label">
                    Anexo{" "}
                    {resultado.anexoRecomendado === "III" ? "V" : "III"}
                  </div>
                  <div className="fr-bar-track">
                    <div
                      className="fr-bar-fill fr-bar-fill-alt"
                      style={{
                        width: `${
                          (resultado.aliquotaAlternativa /
                            Math.max(
                              resultado.aliquotaRecomendada,
                              resultado.aliquotaAlternativa
                            )) * 100
                        }%`,
                      }}
                    >
                      {(resultado.aliquotaAlternativa * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Bloco com pizza + legendas */}
                <div className="fr-pie-section">
                  <div className="fr-pie-wrapper">
                    <svg
                      viewBox="0 0 200 200"
                      className="fr-pie-chart"
                      aria-label="Distribuição de receita: folha, impostos e renda líquida"
                      style={{
                        filter:
                          "drop-shadow(1px 2px 5px rgba(0,0,0,0.15))",
                      }}
                    >
                      {(() => {
                        const center = 100;
                        const r = 80;
                        const segments = [
                          {
                            value: resultado.impostosPercent,
                            color: "#F97316",
                          },
                          {
                            value: resultado.folhaPercent,
                            color: "#52B788",
                          },
                          {
                            value: resultado.rendaPercent,
                            color: "#D00084",
                          },
                        ];

                        let currentAngle = -90;
                        const paths = [];

                        segments.forEach((seg, i) => {
                          if (seg.value <= 0) return;

                          const angle = (seg.value / 100) * 360;
                          const start = (currentAngle * Math.PI) / 180;
                          const end =
                            ((currentAngle + angle) * Math.PI) / 180;

                          const x1 = center + r * Math.cos(start);
                          const y1 = center + r * Math.sin(start);
                          const x2 = center + r * Math.cos(end);
                          const y2 = center + r * Math.sin(end);

                          const largeArc = angle > 180 ? 1 : 0;

                          const d = [
                            `M ${center} ${center}`,
                            `L ${x1} ${y1}`,
                            `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                            "Z",
                          ].join(" ");

                          paths.push(
                            <path
                              key={i}
                              d={d}
                              fill={seg.color}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          );

                          currentAngle += angle;
                        });

                        return paths;
                      })()}
                    </svg>
                  </div>

                  <div className="fr-pie-legend">
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-color"
                        style={{ backgroundColor: "#F97316" }}
                      />
                      <span>
                        Impostos ({resultado.impostosPercent.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-color"
                        style={{ backgroundColor: "#52B788" }}
                      />
                      <span>
                        Folha de Pagamento (
                        {resultado.folhaPercent.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-color"
                        style={{ backgroundColor: "#D00084" }}
                      />
                      <span>
                        Renda Líquida ({resultado.rendaPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumo numérico */}
                <div className="fr-summary">
                  <div className="fr-summary-grid">
                    <div className="fr-summary-row">
                      <strong>Folha (12 meses):</strong>
                      <span>{formatCurrencyBRL(resultado.folha12)}</span>
                    </div>

                    <div className="fr-summary-row">
                      <strong>Receita (12 meses):</strong>
                      <span>{formatCurrencyBRL(resultado.receita12)}</span>
                    </div>

                    <div className="fr-summary-row">
                      <strong>
                        Impostos no Anexo {resultado.anexoRecomendado}:
                      </strong>
                      <span>
                        {formatCurrencyBRL(resultado.impostoRecomendado)}
                      </span>
                    </div>

                    <div className="fr-summary-row">
                      <strong>No outro anexo:</strong>
                      <span>
                        {formatCurrencyBRL(resultado.impostoAlternativo)}
                      </span>
                    </div>
                  </div>

                  <p className="fr-box-note">
                    Este simulador é uma referência. A Conta Ágil recomenda
                    análise completa do enquadramento, CNAE, benefícios e
                    legislação vigente antes de tomar decisões.
                  </p>
                </div>

                {/* Botões finais */}
                <div className="fr-actions-bottom">
                  <button
                    type="button"
                    className="fr-btn-primary"
                    onClick={() => {
                      limparTudo();
                      setTimeout(() => {
                        if (atividadeRef.current) {
                          atividadeRef.current.focus();
                          atividadeRef.current.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }, 150);
                    }}
                  >
                    REFAZER CÁLCULO
                  </button>

                  <button
                    type="button"
                    className="fr-btn-outline"
                    onClick={() => {
                      const texto = `
📌 Resumo do Resultado do Fator R

• Receita (12 meses): ${formatCurrencyBRL(
                        resultado.receita12
                      )}
• Folha/Pró-labore (12 meses): ${formatCurrencyBRL(
                        resultado.folha12
                      )}

• Impostos no Anexo ${resultado.anexoRecomendado}: ${formatCurrencyBRL(
                        resultado.impostoRecomendado
                      )}
• No outro anexo: ${formatCurrencyBRL(
                        resultado.impostoAlternativo
                      )}

💡 Observação:
${resultado.mensagem}
                      `.trim();

                      if (navigator.clipboard?.writeText) {
                        navigator.clipboard
                          .writeText(texto)
                          .then(() => {
                            alert(
                              "📋 Resumo copiado para a área de transferência!"
                            );
                          })
                          .catch(() => {
                            alert(
                              "Não foi possível copiar automaticamente. Tente novamente."
                            );
                          });
                      } else {
                        alert(
                          "Seu navegador não suporta cópia automática. 😕"
                        );
                      }
                    }}
                  >
                    COPIAR RESUMO
                  </button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

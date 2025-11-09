import { useState } from "react";

function parseCurrencyToNumber(value) {
  if (!value) return 0;
  return (
    parseFloat(
      value
        .toString()
        .replace(/[R$\s.]/g, "")
        .replace(",", ".")
    ) || 0
  );
}

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

// Converte string "10.000,00" -> número 10000
function parseCurrencyBR(str) {
  if (!str) return 0;
  return (
    parseFloat(
      str
        .toString()
        .replace(/\./g, "") // remove pontos
        .replace(",", ".")  // troca vírgula por ponto
    ) || 0
  );
}

// Formata enquanto digita: deixa sempre no padrão 0.000,00
function handleCurrencyChange(e, setter) {
  const raw = e.target.value;

  // mantém só dígitos
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    setter("");
    return;
  }

  const number = Number(digits) / 100;

  const formatted = number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  setter(formatted);
}


  function calcular(e) {
    e.preventDefault();
    setAlert(null);
    setResultado(null);

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

    if (tempo === "mais12") {
      const valor = parseCurrencyToNumber(faturamentoMensal);
      if (valor <= 0) {
        setAlert({
          type: "warning",
          title: "Faturamento bruto mensal inválido",
          message:
            "Informe o faturamento bruto mensal para projetarmos corretamente.",
        });
        return;
      }
      receita12 = valor * 12;
    }

    if (tempo === "menos12") {
      const meses = Number(mesesEmpresa);
      const valor = parseCurrencyToNumber(faturamentoMensal);
      if (!meses || meses < 1 || meses > 11) {
        setAlert({
          type: "warning",
          title: "Meses de funcionamento inválidos",
          message: "Informe um número de meses entre 1 e 11.",
        });
        return;
      }
      if (valor <= 0) {
        setAlert({
          type: "warning",
          title: "Faturamento bruto mensal inválido",
          message:
            "Informe o faturamento bruto mensal para que possamos projetar o ano.",
        });
        return;
      }
      receita12 = valor * 12;
    }

    if (tempo === "mais12" && faturamentoAnual) {
      // se quiser usar diretamente os 12 meses em vez do mensal
      const direto = parseCurrencyToNumber(faturamentoAnual);
      if (direto > 0) receita12 = direto;
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
          "Informe o valor mensal total de pró-labore dos sócios (antes de INSS).",
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

    if (receita12 <= 0 || folha12 <= 0) {
      setAlert({
        type: "warning",
        title: "Dados insuficientes",
        message:
          "Verifique se o faturamento e os custos com pessoal foram informados corretamente.",
      });
      return;
    }

    const fatorR = folha12 / receita12;
    const fatorRPercent = fatorR * 100;
    const anexoIII = fatorR >= 0.28;

       const aliquotaAnexo3 = 0.06;   // 6%
    const aliquotaAnexo5 = 0.155;  // 15,5%

    const impostoAnexo3 = receita12 * aliquotaAnexo3;
    const impostoAnexo5 = receita12 * aliquotaAnexo5;

    const usarAnexo3 = fatorR >= 0.28;

    const anexoRecomendado = usarAnexo3 ? "III" : "V";
    const aliquotaRecomendada = usarAnexo3 ? aliquotaAnexo3 : aliquotaAnexo5;
    const aliquotaAlternativa = usarAnexo3 ? aliquotaAnexo5 : aliquotaAnexo3;
    const impostoRecomendado = usarAnexo3 ? impostoAnexo3 : impostoAnexo5;
    const impostoAlternativo = usarAnexo3 ? impostoAnexo5 : impostoAnexo3;

    const folhaPercent = (folha12 / receita12) * 100;
    const impostosPercent = (impostoRecomendado / receita12) * 100;
    const rendaPercent = Math.max(0, 100 - folhaPercent - impostosPercent);

    hideNaN:
    if (!isFinite(folhaPercent) || folhaPercent < 0) {
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
      mensagem:
        usarAnexo3
          ? "Com Fator R igual ou superior a 28%, a tributação tende a ser pelo Anexo III, geralmente mais vantajoso para serviços."
          : "Com Fator R abaixo de 28%, a tributação tende a ser pelo Anexo V. É importante revisar pró-labore e folha com um especialista.",
    });

  }

  return (
    <div className="fr-layout">
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
              <h3>Sua empresa opta pelo Simples Nacional?</h3>
              <div className="fr-options-row">
                <label className="fr-option">
                  <input
                    type="radio"
                    name="simples"
                    checked={simples === true}
                    onChange={() => {
                      setSimples(true);
                      resetFeedback();
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

            {/* Atividade */}
            <section className="fr-question">
              <h3>Qual a atividade de sua empresa?</h3>
              <input
                className="fr-input"
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
              <h3>Há quanto tempo sua empresa está em funcionamento?</h3>
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
                    }}
                  />
                  Menos de 12 meses
                </label>
              </div>
            </section>

            {/* Campos condicionais */}
            {tempo === "menos12" && (
              <section className="fr-question">
                <h3>Há quantos meses sua empresa está em funcionamento?</h3>
                <input
                  className="fr-input"
                  type="number"
                  min="1"
                  max="11"
                  value={mesesEmpresa}
                  onChange={(e) => {
                    setMesesEmpresa(e.target.value);
                    resetFeedback();
                  }}
                  placeholder="Ex: 6"
                />
              </section>
            )}

            <section className="fr-question">
             <h3>Qual o seu faturamento bruto mensal?</h3>
             <input
              className="fr-input"
              type="text"
              value={faturamentoMensal}
              onChange={(e) => handleCurrencyChange(e, setFaturamentoMensal)}
              placeholder="R$ 0,00"
            />
            </section>

            {tempo === "mais12" && (
              <section className="fr-question">
                <h3>Ou informe o faturamento bruto dos últimos 12 meses:</h3>
                <input
                  className="fr-input"
                  value={faturamentoAnual}
                  onChange={(e) => {
                    setFaturamentoAnual(e.target.value);
                    resetFeedback();
                  }}
                  placeholder="Opcional - R$ 0,00"
                />
              </section>
            )}

            {/* Pró-labore */}
            <section className="fr-question">
              <h3>Os sócios recebem pró-labore?</h3>
              <div className="fr-options-row">
                <label className="fr-option">
                  <input
                    type="radio"
                    name="prolabore"
                    checked={temProlabore === true}
                    onChange={() => {
                      setTemProlabore(true);
                      resetFeedback();
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
                <input
                  className="fr-input"
                  value={valorProlabore}
                  onChange={(e) => {
                    setValorProlabore(e.target.value);
                    resetFeedback();
                  }}
                  placeholder="Valor total mensal de pró-labore (R$)"
                />
              )}
            </section>

            {/* Funcionários */}
            <section className="fr-question">
              <h3>Você possui funcionários?</h3>
              <div className="fr-options-row">
                <label className="fr-option">
                  <input
                    type="radio"
                    name="funcionarios"
                    checked={temFuncionarios === true}
                    onChange={() => {
                      setTemFuncionarios(true);
                      resetFeedback();
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
                <input
                  className="fr-input"
                  value={folhaMensal}
                  onChange={(e) => {
                    setFolhaMensal(e.target.value);
                    resetFeedback();
                  }}
                  placeholder="Gasto mensal com folha (R$)"
                />
              )}
            </section>

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

            {/* Botões */}
            <div className="fr-actions">
              <button type="submit" className="fr-btn-primary">
                CALCULAR
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
  <section className="fr-result">
    <h2 className="fr-result-title">
      SEU NEGÓCIO SE ENQUADRA NO ANEXO {resultado.anexoRecomendado}
    </h2>

    <p className="fr-result-text">
      Isso significa que a sua carga de impostos pode ser mais{" "}
      {resultado.anexoRecomendado === "III" ? "leve" : "elevada"}, impactando
      diretamente o crescimento do negócio. Utilize estes números como base
      para avaliar, junto com a Conta Ágil, o melhor planejamento tributário.
    </p>

    {/* Gráfico de barras horizontais: comparação de alíquotas */}
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
        Anexo {resultado.anexoRecomendado === "III" ? "V" : "III"}
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
        >
          {(() => {
            const center = 100;
            const r = 80;
            const segments = [
              { value: resultado.impostosPercent, color: "#f97316" }, // impostos
              { value: resultado.folhaPercent, color: "#2563eb" }, // folha
              { value: resultado.rendaPercent, color: "#8b5cf6" }, // renda líquida
            ];

            let currentAngle = -90; // começa em cima
            const paths = [];

            segments.forEach((seg, i) => {
              if (seg.value <= 0) return;
              const angle = (seg.value / 100) * 360;
              const start = (currentAngle * Math.PI) / 180;
              const end = ((currentAngle + angle) * Math.PI) / 180;

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
            style={{ backgroundColor: "#f97316" }}
          />
          <span>Impostos ({resultado.impostosPercent.toFixed(1)}%)</span>
        </div>
        <div className="fr-legend-item">
          <span
            className="fr-legend-color"
            style={{ backgroundColor: "#2563eb" }}
          />
          <span>Folha de Pagamento ({resultado.folhaPercent.toFixed(1)}%)</span>
        </div>
        <div className="fr-legend-item">
          <span
            className="fr-legend-color"
            style={{ backgroundColor: "#8b5cf6" }}
          />
          <span>Renda Líquida ({resultado.rendaPercent.toFixed(1)}%)</span>
        </div>
      </div>
    </div>

    {/* Resumo numérico */}
    <div className="fr-summary">
      <p>
        <strong>Folha (12 meses):</strong>{" "}
        {formatCurrencyBRL(resultado.folha12)} &nbsp; | &nbsp;
        <strong> Receita (12 meses):</strong>{" "}
        {formatCurrencyBRL(resultado.receita12)}
      </p>
      <p>
        <strong>Impostos no Anexo {resultado.anexoRecomendado}:</strong>{" "}
        {formatCurrencyBRL(resultado.impostoRecomendado)} &nbsp; | &nbsp;
        <strong>No outro anexo:</strong>{" "}
        {formatCurrencyBRL(resultado.impostoAlternativo)}
      </p>
      <p className="fr-box-note">
        Este simulador é uma referência. A Conta Ágil recomenda análise completa
        do enquadramento, CNAE, benefícios e legislação vigente antes de tomar
        decisões.
      </p>
    </div>

    <div className="fr-actions-bottom">
      <button
        type="button"
        className="fr-btn-primary"
        onClick={limparTudo}
      >
        REFAZER CÁLCULO
      </button>
    </div>
  </section>
)}

        </div>
      </main>
    </div>
  );
}

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
  const [simples, setSimples] = useState(null); // true / false
  const [atividade, setAtividade] = useState("");
  const [tempo, setTempo] = useState(""); // "menos12" | "mais12"
  const [mesesEmpresa, setMesesEmpresa] = useState("");
  const [faturamentoMensalMedio, setFaturamentoMensalMedio] = useState("");
  const [faturamentoAnual, setFaturamentoAnual] = useState("");

  const [temProlabore, setTemProlabore] = useState(null);
  const [valorProlabore, setValorProlabore] = useState("");
  const [temFuncionarios, setTemFuncionarios] = useState(null);
  const [folhaMensal, setFolhaMensal] = useState("");

  const [alert, setAlert] = useState(null);
  const [resultado, setResultado] = useState(null);

  function resetResultado() {
    setResultado(null);
    setAlert(null);
  }

  function handleSimplesChange(value) {
    setSimples(value);
    resetResultado();
    if (!value) {
      // se "Não é Simples", já mostra orientação
      setAlert({
        type: "info",
        title: "Fator R é exclusivo para empresas do Simples Nacional",
        message:
          "Se a empresa não é optante pelo Simples Nacional, essa calculadora não se aplica. O ideal é uma análise personalizada do regime tributário.",
      });
    } else {
      setAlert(null);
    }
  }

  function handleTempoChange(value) {
    setTempo(value);
    setMesesEmpresa("");
    setFaturamentoAnual("");
    resetResultado();
  }

  function handleTemProlabore(value) {
    setTemProlabore(value);
    if (!value) setValorProlabore("");
    resetResultado();
  }

  function handleTemFuncionarios(value) {
    setTemFuncionarios(value);
    if (!value) setFolhaMensal("");
    resetResultado();
  }

  function calcularFatorR(e) {
    e.preventDefault();
    setAlert(null);
    setResultado(null);

    // Validações principais
    if (simples !== true) {
      setAlert({
        type: "warning",
        title: "Verifique o enquadramento",
        message:
          "O Fator R só é aplicável para empresas optantes pelo Simples Nacional. Confirme essa informação antes de prosseguir.",
      });
      return;
    }

    if (!atividade) {
      setAlert({
        type: "warning",
        title: "Informe a atividade",
        message:
          "Selecione a atividade principal da empresa. Isso ajuda a orientar o enquadramento entre Anexo III ou V.",
      });
      return;
    }

    if (!tempo) {
      setAlert({
        type: "warning",
        title: "Informe o tempo de atividade",
        message:
          "Marque se a empresa tem menos de 12 meses ou mais de 12 meses de funcionamento.",
      });
      return;
    }

    let faturamento12 = 0;

    if (tempo === "menos12") {
      const meses = Number(mesesEmpresa);
      const fatMensal = parseCurrencyToNumber(faturamentoMensalMedio);

      if (!meses || meses < 1 || meses > 11) {
        setAlert({
          type: "warning",
          title: "Meses de funcionamento inválidos",
          message: "Informe um número de meses entre 1 e 11.",
        });
        return;
      }

      if (fatMensal <= 0) {
        setAlert({
          type: "warning",
          title: "Faturamento médio mensal inválido",
          message:
            "Informe o faturamento bruto médio mensal para projetarmos o faturamento anual.",
        });
        return;
      }

      faturamento12 = fatMensal * 12; // projeção anual
    }

    if (tempo === "mais12") {
      const fatAnual = parseCurrencyToNumber(faturamentoAnual);
      if (fatAnual <= 0) {
        setAlert({
          type: "warning",
          title: "Faturamento anual inválido",
          message:
            "Informe o faturamento bruto dos últimos 12 meses para seguir com o cálculo.",
        });
        return;
      }
      faturamento12 = fatAnual;
    }

    // Pro-labore / folha
    if (temProlabore === null || temFuncionarios === null) {
      setAlert({
        type: "warning",
        title: "Responda todas as questões",
        message:
          "Informe se há pró-labore e se há funcionários CLT para calcular corretamente o Fator R.",
      });
      return;
    }

    const prolaboreMensal = temProlabore
      ? parseCurrencyToNumber(valorProlabore)
      : 0;

    const folhaMensalValor = temFuncionarios
      ? parseCurrencyToNumber(folhaMensal)
      : 0;

    if (temProlabore && prolaboreMensal <= 0) {
      setAlert({
        type: "warning",
        title: "Pró-labore inválido",
        message:
          "Informe o valor mensal total de pró-labore (somando todos os sócios).",
      });
      return;
    }

    if (temFuncionarios && folhaMensalValor <= 0) {
      setAlert({
        type: "warning",
        title: "Folha de pagamento inválida",
        message:
          "Informe o custo mensal total com funcionários (salários + encargos).",
      });
      return;
    }

    const folha12 = (prolaboreMensal + folhaMensalValor) * 12;

    if (faturamento12 <= 0 || folha12 <= 0) {
      setAlert({
        type: "warning",
        title: "Dados insuficientes",
        message:
          "Verifique se faturamento e custos com pessoal foram preenchidos corretamente.",
      });
      return;
    }

    // Regra oficial: Fator R = folha_12 / receita_12
    const fatorR = folha12 / faturamento12;
    const fatorRPercent = fatorR * 100;

    // Decisão: >= 28% => Anexo III, senão Anexo V
    const anexoIII = fatorR >= 0.28;

    setResultado({
      fatorR,
      fatorRPercent,
      faturamento12,
      folha12,
      anexo: anexoIII ? "III" : "V",
      mensagem: anexoIII
        ? "Com Fator R igual ou superior a 28%, a tendência é enquadrar no Anexo III, que costuma ter carga tributária mais leve para prestação de serviços."
        : "Com Fator R abaixo de 28%, a tendência é enquadrar no Anexo V, que geralmente resulta em carga tributária maior. É importante revisar estrutura de pró-labore e folha.",
    });
  }

  function limparTudo() {
    setSimples(null);
    setAtividade("");
    setTempo("");
    setMesesEmpresa("");
    setFaturamentoMensalMedio("");
    setFaturamentoAnual("");
    setTemProlabore(null);
    setValorProlabore("");
    setTemFuncionarios(null);
    setFolhaMensal("");
    setAlert(null);
    setResultado(null);
  }

  return (
    <div className="fr-layout">
      {/* Lateral explicativa */}
      <aside className="fr-sidebar">
        <h2>Calculadora Fator R</h2>
        <p>
          Ferramenta desenvolvida para apoiar empresas do{" "}
          <strong>Simples Nacional</strong> na análise do Fator R e definição do
          enquadramento entre <strong>Anexo III</strong> ou{" "}
          <strong>Anexo V</strong>.
        </p>
        <p style={{ marginTop: 10, fontSize: 13 }}>
          Preencha os dados abaixo e veja o resultado de forma clara, com
          explicação e orientação pensada no padrão Conta Ágil.
        </p>
      </aside>

      {/* Conteúdo principal */}
      <main className="fr-content">
        <header className="fr-header">
          <div className="fr-brand">ContaÁgil · Widget Fator R</div>
          <div className="fr-badge">Versão beta para avaliação interna</div>
        </header>

        <form className="fr-form" onSubmit={calcularFatorR}>
          {/* Simples Nacional */}
          <section className="fr-question">
            <h3>Sua empresa é optante pelo Simples Nacional?</h3>
            <div className="fr-options-row">
              <label className="fr-option">
                <input
                  type="radio"
                  name="simples"
                  checked={simples === true}
                  onChange={() => handleSimplesChange(true)}
                />
                Sim
              </label>
              <label className="fr-option">
                <input
                  type="radio"
                  name="simples"
                  checked={simples === false}
                  onChange={() => handleSimplesChange(false)}
                />
                Não
              </label>
            </div>
          </section>

          {/* Atividade */}
          <section className="fr-question">
            <h3>Qual é a atividade principal?</h3>
            <select
              className="fr-input"
              value={atividade}
              onChange={(e) => {
                setAtividade(e.target.value);
                resetResultado();
              }}
            >
              <option value="">Selecione</option>
              <option value="consultoria">Consultoria</option>
              <option value="desenvolvimento">Desenvolvimento de Software</option>
              <option value="marketing">Marketing / Tráfego</option>
              <option value="contabilidade">Contabilidade</option>
              <option value="advocacia">Advocacia</option>
              <option value="saude">Saúde</option>
              <option value="engenharia">Engenharia / Arquitetura</option>
              <option value="educacao">Educação / Treinamentos</option>
              <option value="outros">Outros serviços intelectuais</option>
            </select>
          </section>

          {/* Tempo de atividade */}
          <section className="fr-question">
            <h3>Há quanto tempo a empresa está em funcionamento?</h3>
            <div className="fr-options-row">
              <label className="fr-option">
                <input
                  type="radio"
                  name="tempo"
                  checked={tempo === "menos12"}
                  onChange={() => handleTempoChange("menos12")}
                />
                Menos de 12 meses
              </label>
              <label className="fr-option">
                <input
                  type="radio"
                  name="tempo"
                  checked={tempo === "mais12"}
                  onChange={() => handleTempoChange("mais12")}
                />
                12 meses ou mais
              </label>
            </div>
          </section>

          {/* Campos condicionais de faturamento */}
          {tempo === "menos12" && (
            <>
              <section className="fr-question">
                <h3>Meses completos de operação</h3>
                <input
                  className="fr-input"
                  type="number"
                  min="1"
                  max="11"
                  value={mesesEmpresa}
                  onChange={(e) => {
                    setMesesEmpresa(e.target.value);
                    resetResultado();
                  }}
                  placeholder="Ex: 6"
                />
              </section>

              <section className="fr-question">
                <h3>Faturamento bruto médio mensal</h3>
                <input
                  className="fr-input"
                  value={faturamentoMensalMedio}
                  onChange={(e) => {
                    setFaturamentoMensalMedio(e.target.value);
                    resetResultado();
                  }}
                  placeholder="Ex: R$ 50.000,00"
                />
              </section>
            </>
          )}

          {tempo === "mais12" && (
            <section className="fr-question">
              <h3>Faturamento bruto dos últimos 12 meses</h3>
              <input
                className="fr-input"
                value={faturamentoAnual}
                onChange={(e) => {
                  setFaturamentoAnual(e.target.value);
                  resetResultado();
                }}
                placeholder="Ex: R$ 600.000,00"
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
                  onChange={() => handleTemProlabore(true)}
                />
                Sim
              </label>
              <label className="fr-option">
                <input
                  type="radio"
                  name="prolabore"
                  checked={temProlabore === false}
                  onChange={() => handleTemProlabore(false)}
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
                  resetResultado();
                }}
                placeholder="Valor total mensal de pró-labore (R$)"
              />
            )}
          </section>

          {/* Funcionários */}
          <section className="fr-question">
            <h3>Possui funcionários CLT ou estagiários?</h3>
            <div className="fr-options-row">
              <label className="fr-option">
                <input
                  type="radio"
                  name="funcionarios"
                  checked={temFuncionarios === true}
                  onChange={() => handleTemFuncionarios(true)}
                />
                Sim
              </label>
              <label className="fr-option">
                <input
                  type="radio"
                  name="funcionarios"
                  checked={temFuncionarios === false}
                  onChange={() => handleTemFuncionarios(false)}
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
                  resetResultado();
                }}
                placeholder="Custo mensal total com folha (R$)"
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
              Calcular Fator R
            </button>
            <button
              type="button"
              className="fr-btn-outline"
              onClick={limparTudo}
            >
              Limpar dados
            </button>
          </div>
        </form>

        {/* Resultado */}
        {resultado && (
          <section className="fr-box" style={{ marginTop: 20 }}>
            <h3>
              Resultado: tendência ao Anexo {resultado.anexo} do Simples
              Nacional
            </h3>
            <p>
              <strong>Fator R calculado:</strong>{" "}
              {resultado.fatorRPercent.toFixed(2)}%
            </p>
            <p>
              <strong>Folha (12 meses):</strong>{" "}
              {formatCurrencyBRL(resultado.folha12)} |{" "}
              <strong>Faturamento (12 meses):</strong>{" "}
              {formatCurrencyBRL(resultado.faturamento12)}
            </p>
            <p>{resultado.mensagem}</p>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              Importante: este cálculo é uma simulação. A Conta Ágil sempre
              recomenda análise detalhada do contrato social, CNAE, histórico e
              faixas do Simples antes de uma decisão definitiva.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

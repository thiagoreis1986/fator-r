import { useState } from "react";

export default function FatorRCalculator() {
  const [simples, setSimples] = useState(null);
  const [atividade, setAtividade] = useState("");
  const [tempo, setTempo] = useState(null);
  const [meses, setMeses] = useState("");
  const [faturamentoMensal, setFaturamentoMensal] = useState("");
  const [faturamentoMensalBase, setFaturamentoMensalBase] = useState(0);
  const [faturamentoAnual, setFaturamentoAnual] = useState("");
  const [tela, setTela] = useState("initial"); // initial, notEligible, alert, mais12, detailed, result3, result5, error
  const [mensagemAlerta, setMensagemAlerta] = useState("");

  const [prolaboreTem, setProlaboreTem] = useState(null);
  const [prolaboreValor, setProlaboreValor] = useState("");
  const [temFuncionarios, setTemFuncionarios] = useState(null);
  const [folhaPagamento, setFolhaPagamento] = useState("");
  const [fatorR, setFatorR] = useState(null);

  // --- Helpers moeda ---
  const parseCurrency = (value) => {
    if (!value) return 0;
    const digits = value.replace(/[^\d]/g, "");
    if (!digits) return 0;
    return Number(digits) / 100;
  };

  const formatBRL = (number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(number);

  const handleMoeda = (setter) => (e) => {
    const numeric = parseCurrency(e.target.value);
    if (!numeric) {
      setter("");
      return;
    }
    setter(formatBRL(numeric));
  };

  const handleFaturamentoMensalChange = handleMoeda(setFaturamentoMensal);
  const handleFaturamentoAnualChange = handleMoeda(setFaturamentoAnual);
  const handleProlaboreValorChange = handleMoeda(setProlaboreValor);
  const handleFolhaPagamentoChange = handleMoeda(setFolhaPagamento);

  // --- Controles iniciais ---
  const handleSimplesClick = (valor) => {
    setSimples((prev) => (prev === valor ? null : valor));
  };

  const handleTempoClick = (valor) => {
    setTempo(valor);
    setMeses("");
  };

  const resetAlerta = () => setMensagemAlerta("");

  const handleNextStep = () => {
    resetAlerta();
    const fatNum = parseCurrency(faturamentoMensal);

    if (!simples || !atividade || !tempo || !fatNum || fatNum <= 0) {
      setMensagemAlerta(
        "Por favor, preencha todos os campos obrigatórios com valores válidos."
      );
      return;
    }

    setFaturamentoMensalBase(fatNum);

    if (simples === "nao") {
      setTela("notEligible");
      return;
    }

    if (tempo === "menos12") {
      const m = Number(meses);
      if (!m || m < 1 || m > 11) {
        setMensagemAlerta(
          "Informe há quantos meses sua empresa está em funcionamento (1 a 11 meses)."
        );
        return;
      }
      setTela("alert");
      return;
    }

    if (tempo === "mais12") {
      setTela("mais12");
    }
  };

  const fromAlertContinuar = () => {
    if (!faturamentoMensalBase) {
      setMensagemAlerta(
        "Volte e informe o faturamento mensal antes de continuar."
      );
      setTela("initial");
      return;
    }
    setTela("detailed");
  };

  const fromMais12Continuar = () => {
    resetAlerta();
    const fatAnual = parseCurrency(faturamentoAnual);
    if (!fatAnual || fatAnual <= 0) {
      setMensagemAlerta(
        "Informe o faturamento bruto anual dos últimos 12 meses."
      );
      return;
    }
    const mensal = fatAnual / 12;
    setFaturamentoMensalBase(mensal);
    setTela("detailed");
  };

  const resetar = () => {
    setSimples(null);
    setAtividade("");
    setTempo(null);
    setMeses("");
    setFaturamentoMensal("");
    setFaturamentoMensalBase(0);
    setFaturamentoAnual("");
    setMensagemAlerta("");
    setProlaboreTem(null);
    setProlaboreValor("");
    setTemFuncionarios(null);
    setFolhaPagamento("");
    setFatorR(null);
    setTela("initial");
  };

  // --- Cálculo Fator R ---
  const handleCalcularFatorR = () => {
    resetAlerta();

    if (prolaboreTem === null || temFuncionarios === null) {
      setMensagemAlerta(
        "Responda se há pró-labore e se há funcionários registrados."
      );
      return;
    }

    const prolabore = prolaboreTem ? parseCurrency(prolaboreValor) : 0;
    const folha = temFuncionarios ? parseCurrency(folhaPagamento) : 0;

    if (prolaboreTem && prolabore <= 0) {
      setMensagemAlerta("Informe um valor válido de pró-labore.");
      return;
    }

    if (temFuncionarios && folha <= 0) {
      setMensagemAlerta(
        "Informe um valor válido para o total da folha de pagamento."
      );
      return;
    }

    if (!faturamentoMensalBase || faturamentoMensalBase <= 0) {
      setMensagemAlerta(
        "Houve um problema com o faturamento. Volte ao início e preencha novamente."
      );
      return;
    }

    const totalFolha = prolabore + folha;

    if (totalFolha <= 0) {
      setMensagemAlerta(
        "É necessário ter algum gasto com pró-labore ou folha para calcular o Fator R."
      );
      return;
    }

    if (totalFolha > faturamentoMensalBase * 1.5) {
      setTela("error");
      return;
    }

    const fator = totalFolha / faturamentoMensalBase;
    setFatorR(fator);

    if (fator >= 0.28) {
      setTela("result3");
    } else {
      setTela("result5");
    }
  };

  // --- UI ---
  return (
    <div className="main-container">
      {/* Sidebar fixa da calculadora */}
      <aside className="sidebar">
        <h1>CALCULADORA FATOR R</h1>
        <p>
          Descubra se sua empresa se enquadra no Anexo III ou V do Simples
          Nacional, considerando a relação entre folha de pagamento e receita
          bruta.
        </p>
      </aside>

      {/* Conteúdo dinâmico */}
      <main className="content">
        {/* TELA INICIAL */}
        {tela === "initial" && (
          <div className="form-section">
            {mensagemAlerta && (
              <div className="alert alert-warning">
                <strong>Atenção!</strong> {mensagemAlerta}
              </div>
            )}

            {/* Simples */}
            <div className="question">
              <div className="question-header">
                <h3>Sua empresa opta pelo Simples Nacional?</h3>
              </div>
              <div className="checkbox-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={simples === "sim"}
                    onChange={() => handleSimplesClick("sim")}
                  />
                  <span>Sim</span>
                </label>
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={simples === "nao"}
                    onChange={() => handleSimplesClick("nao")}
                  />
                  <span>Não</span>
                </label>
              </div>
            </div>

            {/* Atividade */}
            <div className="question">
              <div className="question-header">
                <h3>Qual a atividade de sua empresa?</h3>
              </div>
              <select
                className="input-field"
                value={atividade}
                onChange={(e) => setAtividade(e.target.value)}
              >
                <option value="">Selecione a atividade</option>
                <option value="consultoria">Consultoria</option>
                <option value="desenvolvimento">
                  Desenvolvimento de Software
                </option>
                <option value="marketing">Marketing Digital</option>
                <option value="contabilidade">Contabilidade</option>
                <option value="advocacia">Advocacia</option>
                <option value="arquitetura">Arquitetura</option>
                <option value="engenharia">Engenharia</option>
                <option value="design">Design</option>
                <option value="educacao">Educação</option>
                <option value="saude">Saúde</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            {/* Tempo */}
            <div className="question">
              <div className="question-header">
                <h3>Há quanto tempo sua empresa está em funcionamento?</h3>
              </div>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    checked={tempo === "menos12"}
                    onChange={() => handleTempoClick("menos12")}
                  />
                  <span>Menos de 12 meses</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    checked={tempo === "mais12"}
                    onChange={() => handleTempoClick("mais12")}
                  />
                  <span>Mais de 12 meses</span>
                </label>
              </div>
            </div>

            {/* Meses se < 12 */}
            {tempo === "menos12" && (
              <div className="question">
                <div className="question-header">
                  <h3>
                    Há quantos meses sua empresa está em funcionamento?
                  </h3>
                </div>
                <input
                  type="number"
                  className="input-field"
                  value={meses}
                  onChange={(e) => setMeses(e.target.value)}
                  min="1"
                  max="11"
                  placeholder="Ex: 6"
                />
              </div>
            )}

            {/* Faturamento mensal */}
            <div className="question">
              <div className="question-header">
                <h3>Qual o seu faturamento bruto mensal?</h3>
              </div>
              <input
                type="text"
                className="input-field"
                value={faturamentoMensal}
                onChange={handleFaturamentoMensalChange}
                placeholder="Ex: R$ 50.000,00"
              />
            </div>

            <button className="calculate-button" onClick={handleNextStep}>
              CONTINUAR
            </button>
          </div>
        )}

        {/* NÃO ELEGÍVEL */}
        {tela === "notEligible" && (
          <div className="form-section">
            <div className="alert alert-warning">
              <strong>
                O cálculo do Fator R só vale para empresas que estão no Simples
                Nacional.
              </strong>
              <br />
              <br />
              Avalie outras estratégias com um especialista tributário.
            </div>
            <button
              className="calculate-button"
              onClick={() =>
                window.open("https://wa.me/5511999999999", "_blank")
              }
            >
              FALAR COM ESPECIALISTA
            </button>
            <div style={{ marginTop: 15 }}>
              <button className="recalculate-button" onClick={resetar}>
                VOLTAR AO INÍCIO
              </button>
            </div>
          </div>
        )}

        {/* ALERTA (< 12 meses) */}
        {tela === "alert" && (
          <div className="form-section">
            <div className="alert alert-info">
              <strong>ATENÇÃO:</strong> Para empresas com menos de 12 meses,
              usamos projeções. Recomendamos validar os resultados com seu
              contador.
            </div>
            <button
              className="calculate-button"
              onClick={fromAlertContinuar}
            >
              CONTINUAR CÁLCULO
            </button>
            <div style={{ marginTop: 15 }}>
              <button className="recalculate-button" onClick={resetar}>
                VOLTAR AO INÍCIO
              </button>
            </div>
          </div>
        )}

        {/* MAIS DE 12 MESES → FATURAMENTO ANUAL */}
        {tela === "mais12" && (
          <div className="form-section">
            {mensagemAlerta && (
              <div className="alert alert-warning">
                <strong>Atenção!</strong> {mensagemAlerta}
              </div>
            )}
            <div className="question">
              <div className="question-header">
                <h3>
                  Qual o seu faturamento bruto anual dos últimos 12 meses?
                </h3>
              </div>
              <input
                type="text"
                className="input-field"
                value={faturamentoAnual}
                onChange={handleFaturamentoAnualChange}
                placeholder="Ex: R$ 600.000,00"
              />
            </div>
            <button
              className="calculate-button"
              onClick={fromMais12Continuar}
            >
              CONTINUAR CÁLCULO
            </button>
            <div style={{ marginTop: 15 }}>
              <button className="recalculate-button" onClick={resetar}>
                VOLTAR AO INÍCIO
              </button>
            </div>
          </div>
        )}

        {/* DETALHAMENTO */}
        {tela === "detailed" && (
          <div className="form-section">
            {mensagemAlerta && (
              <div className="alert alert-warning">
                <strong>Atenção!</strong> {mensagemAlerta}
              </div>
            )}

            {/* Pró-labore */}
            <div className="question">
              <div className="question-header">
                <h3>Você recebe pró-labore?</h3>
              </div>
              <div className="checkbox-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={prolaboreTem === true}
                    onChange={() =>
                      setProlaboreTem(
                        prolaboreTem === true ? null : true
                      )
                    }
                  />
                  <span>Sim</span>
                </label>
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={prolaboreTem === false}
                    onChange={() =>
                      setProlaboreTem(
                        prolaboreTem === false ? null : false
                      )
                    }
                  />
                  <span>Não</span>
                </label>
              </div>
            </div>

            {prolaboreTem === true && (
              <div className="question">
                <div className="question-header">
                  <h3>Qual o valor total mensal do pró-labore?</h3>
                </div>
                <input
                  type="text"
                  className="input-field"
                  value={prolaboreValor}
                  onChange={handleProlaboreValorChange}
                  placeholder="Ex: R$ 5.000,00"
                />
              </div>
            )}

            {/* Funcionários */}
            <div className="question">
              <div className="question-header">
                <h3>Você possui funcionários CLT?</h3>
              </div>
              <div className="checkbox-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={temFuncionarios === true}
                    onChange={() =>
                      setTemFuncionarios(
                        temFuncionarios === true ? null : true
                      )
                    }
                  />
                  <span>Sim</span>
                </label>
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={temFuncionarios === false}
                    onChange={() =>
                      setTemFuncionarios(
                        temFuncionarios === false ? null : false
                      )
                    }
                  />
                  <span>Não</span>
                </label>
              </div>
            </div>

            {temFuncionarios === true && (
              <div className="question">
                <div className="question-header">
                  <h3>
                    Qual seu gasto médio mensal com folha completa
                    (salários + encargos)?
                  </h3>
                </div>
                <input
                  type="text"
                  className="input-field"
                  value={folhaPagamento}
                  onChange={handleFolhaPagamentoChange}
                  placeholder="Ex: R$ 8.000,00"
                />
              </div>
            )}

            <button
              className="calculate-button"
              onClick={handleCalcularFatorR}
            >
              CALCULAR MEU FATOR R
            </button>

            <div style={{ marginTop: 15 }}>
              <button className="recalculate-button" onClick={resetar}>
                VOLTAR AO INÍCIO
              </button>
            </div>
          </div>
        )}

        {/* RESULTADO ANEXO III */}
        {tela === "result3" && fatorR !== null && (
          <div className="result-container">
            <h2 className="result-title">
              Seu negócio se enquadra no Anexo III
            </h2>
            <p className="result-description">
              Seu Fator R é{" "}
              <strong>{(fatorR * 100).toFixed(1)}%</strong>, igual ou acima de
              28%. Isso indica um enquadramento mais vantajoso no Anexo III.
            </p>
            <button
              className="calculate-button"
              onClick={() =>
                window.open("https://wa.me/5511999999999", "_blank")
              }
            >
              FALAR COM ESPECIALISTA
            </button>
            <div style={{ marginTop: 15 }}>
              <button className="recalculate-button" onClick={resetar}>
                REFAZER CÁLCULO
              </button>
            </div>
          </div>
        )}

        {/* RESULTADO ANEXO V */}
        {tela === "result5" && fatorR !== null && (
          <div className="result-container">
            <h2 className="result-title">
              Seu negócio se enquadra no Anexo V
            </h2>
            <p className="result-description">
              Seu Fator R é{" "}
              <strong>{(fatorR * 100).toFixed(1)}%</strong>, abaixo de 28%.
              Isso indica enquadramento no Anexo V, mas existem estratégias
              para melhorar esse índice e reduzir a carga tributária.
            </p>
            <button
              className="calculate-button"
              onClick={() =>
                window.open("https://wa.me/5511999999999", "_blank")
              }
            >
              FALAR COM ESPECIALISTA
            </button>
            <div style={{ marginTop: 15 }}>
              <button className="recalculate-button" onClick={resetar}>
                REFAZER CÁLCULO
              </button>
            </div>
          </div>
        )}

        {/* ERRO */}
        {tela === "error" && (
          <div className="result-container">
            <h2 className="result-title">
              Verifique os valores informados
            </h2>
            <p className="result-description">
              Os valores de pró-labore e/ou folha parecem muito altos em relação
              ao faturamento. Ajuste para obter um cálculo mais realista.
            </p>
            <button className="recalculate-button" onClick={resetar}>
              VOLTAR E AJUSTAR DADOS
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

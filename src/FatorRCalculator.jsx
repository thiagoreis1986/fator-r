import { useState } from "react";

export default function FatorRCalculator() {
  const [simples, setSimples] = useState(null);
  const [atividade, setAtividade] = useState("");
  const [tempo, setTempo] = useState(null);
  const [meses, setMeses] = useState("");
  const [faturamentoMensal, setFaturamentoMensal] = useState("");
  const [faturamentoMensalBase, setFaturamentoMensalBase] = useState(0);
  const [faturamentoAnual, setFaturamentoAnual] = useState("");
  const [tela, setTela] = useState("initial");
  const [mensagemAlerta, setMensagemAlerta] = useState("");

  const [prolaboreTem, setProlaboreTem] = useState(null);
  const [prolaboreValor, setProlaboreValor] = useState("");
  const [temFuncionarios, setTemFuncionarios] = useState(null);
  const [folhaPagamento, setFolhaPagamento] = useState("");
  const [fatorR, setFatorR] = useState(null);

  // Helpers moeda
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

  // Fluxo inicial
  const resetAlerta = () => setMensagemAlerta("");

  const handleSimplesClick = (valor) => {
    setSimples((prev) => (prev === valor ? null : valor));
  };

  const handleTempoClick = (valor) => {
    setTempo(valor);
    setMeses("");
  };

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

  // Cálculo Fator R
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

  return (
    <div className="fr-layout">
      {/* Sidebar da ferramenta */}
      <aside className="fr-sidebar">
        <h2>Calculadora Fator R</h2>
        <p>
          Esta ferramenta ajuda você a identificar se o seu negócio se enquadra
          no Anexo III ou V do Simples Nacional com base na relação entre folha
          de pagamento e faturamento.
        </p>
      </aside>

      {/* Conteúdo dinâmico */}
      <main className="fr-content">
        {/* ALERTA GLOBAL */}
        {mensagemAlerta && (
          <div className="fr-alert fr-alert-warning">
            <strong>Atenção!</strong> {mensagemAlerta}
          </div>
        )}

        {/* TELA INICIAL */}
        {tela === "initial" && (
          <div className="fr-form">
            {/* Simples */}
            <div className="fr-question">
              <h3>Sua empresa opta pelo Simples Nacional?</h3>
              <div className="fr-options-row">
                <label className="fr-option">
                  <input
                    type="checkbox"
                    checked={simples === "sim"}
                    onChange={() => handleSimplesClick("sim")}
                  />
                  <span>Sim</span>
                </label>
                <label className="fr-option">
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
            <div className="fr-question">
              <h3>Qual a atividade de sua empresa?</h3>
              <select
                className="fr-input"
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
            <div className="fr-question">
              <h3>Há quanto tempo sua empresa está em funcionamento?</h3>
              <div className="fr-options-col">
                <label className="fr-option">
                  <input
                    type="radio"
                    checked={tempo === "menos12"}
                    onChange={() => handleTempoClick("menos12")}
                  />
                  <span>Menos de 12 meses</span>
                </label>
                <label className="fr-option">
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
              <div className="fr-question">
                <h3>
                  Há quantos meses sua empresa está em funcionamento? (1 a 11)
                </h3>
                <input
                  type="number"
                  className="fr-input"
                  value={meses}
                  onChange={(e) => setMeses(e.target.value)}
                  min="1"
                  max="11"
                  placeholder="Ex: 6"
                />
              </div>
            )}

            {/* Faturamento mensal */}
            <div className="fr-question">
              <h3>Qual o seu faturamento bruto mensal?</h3>
              <input
                type="text"
                className="fr-input"
                value={faturamentoMensal}
                onChange={handleFaturamentoMensalChange}
                placeholder="Ex: R$ 50.000,00"
              />
            </div>

            <button className="fr-btn-primary" onClick={handleNextStep}>
              CONTINUAR
            </button>
          </div>
        )}

        {/* NÃO ELEGÍVEL */}
        {tela === "notEligible" && (
          <div className="fr-box">
            <div className="fr-alert fr-alert-warning">
              <strong>Importante:</strong> O Fator R só se aplica a empresas do
              Simples Nacional.
            </div>
            <p>
              Caso sua empresa não seja optante, existem outras estratégias
              tributárias que podem ser avaliadas.
            </p>
            <button
              className="fr-btn-primary"
              onClick={() =>
                window.open("https://wa.me/5511999999999", "_blank")
              }
            >
              FALAR COM ESPECIALISTA
            </button>
            <button className="fr-btn-outline" onClick={resetar}>
              VOLTAR AO INÍCIO
            </button>
          </div>
        )}

        {/* ALERT (<12) */}
        {tela === "alert" && (
          <div className="fr-box">
            <div className="fr-alert fr-alert-info">
              Para empresas com menos de 12 meses, o cálculo é estimado com base
              no cenário atual. Use como referência e valide com seu contador.
            </div>
            <button
              className="fr-btn-primary"
              onClick={fromAlertContinuar}
            >
              CONTINUAR CÁLCULO
            </button>
            <button className="fr-btn-outline" onClick={resetar}>
              VOLTAR AO INÍCIO
            </button>
          </div>
        )}

        {/* MAIS DE 12 MESES */}
        {tela === "mais12" && (
          <div className="fr-form">
            <div className="fr-question">
              <h3>
                Qual o seu faturamento bruto anual dos últimos 12 meses?
              </h3>
              <input
                type="text"
                className="fr-input"
                value={faturamentoAnual}
                onChange={handleFaturamentoAnualChange}
                placeholder="Ex: R$ 600.000,00"
              />
            </div>
            <button
              className="fr-btn-primary"
              onClick={fromMais12Continuar}
            >
              CONTINUAR CÁLCULO
            </button>
            <button className="fr-btn-outline" onClick={resetar}>
              VOLTAR AO INÍCIO
            </button>
          </div>
        )}

        {/* DETALHADO */}
        {tela === "detailed" && (
          <div className="fr-form">
            {/* pró-labore */}
            <div className="fr-question">
              <h3>Você recebe pró-labore?</h3>
              <div className="fr-options-row">
                <label className="fr-option">
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
                <label className="fr-option">
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
              <div className="fr-question">
                <h3>Qual o valor total mensal do pró-labore?</h3>
                <input
                  type="text"
                  className="fr-input"
                  value={prolaboreValor}
                  onChange={handleProlaboreValorChange}
                  placeholder="Ex: R$ 5.000,00"
                />
              </div>
            )}

            {/* funcionários */}
            <div className="fr-question">
              <h3>Você possui funcionários CLT?</h3>
              <div className="fr-options-row">
                <label className="fr-option">
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
                <label className="fr-option">
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
              <div className="fr-question">
                <h3>
                  Qual seu gasto médio mensal com folha completa (salários +
                  encargos)?
                </h3>
                <input
                  type="text"
                  className="fr-input"
                  value={folhaPagamento}
                  onChange={handleFolhaPagamentoChange}
                  placeholder="Ex: R$ 8.000,00"
                />
              </div>
            )}

            <button
              className="fr-btn-primary"
              onClick={handleCalcularFatorR}
            >
              CALCULAR MEU FATOR R
            </button>
            <button className="fr-btn-outline" onClick={resetar}>
              VOLTAR AO INÍCIO
            </button>
          </div>
        )}

        {/* RESULTADO III */}
        {tela === "result3" && fatorR !== null && (
          <div className="fr-box">
            <h3>Seu negócio se enquadra no Anexo III</h3>
            <p>
              Seu Fator R é{" "}
              <strong>{(fatorR * 100).toFixed(1)}%</strong> (≥ 28%). Esse cenário
              tende a ser mais vantajoso na tributação.
            </p>
            <button
              className="fr-btn-primary"
              onClick={() =>
                window.open("https://wa.me/5511999999999", "_blank")
              }
            >
              FALAR COM ESPECIALISTA
            </button>
            <button className="fr-btn-outline" onClick={resetar}>
              REFAZER CÁLCULO
            </button>
          </div>
        )}

        {/* RESULTADO V */}
        {tela === "result5" && fatorR !== null && (
          <div className="fr-box">
            <h3>Seu negócio se enquadra no Anexo V</h3>
            <p>
              Seu Fator R é{" "}
              <strong>{(fatorR * 100).toFixed(1)}%</strong> (&lt; 28%). Ainda assim, é
              possível planejar ajustes para melhorar esse índice.
            </p>
            <button
              className="fr-btn-primary"
              onClick={() =>
                window.open("https://wa.me/5511999999999", "_blank")
              }
            >
              FALAR COM ESPECIALISTA
            </button>
            <button className="fr-btn-outline" onClick={resetar}>
              REFAZER CÁLCULO
            </button>
          </div>
        )}

        {/* ERRO */}
        {tela === "error" && (
          <div className="fr-box">
            <h3>Revise os valores informados</h3>
            <p>
              A soma de pró-labore e folha está muito acima do faturamento.
              Ajuste os dados para obter um resultado mais realista.
            </p>
            <button className="fr-btn-outline" onClick={resetar}>
              VOLTAR E AJUSTAR
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

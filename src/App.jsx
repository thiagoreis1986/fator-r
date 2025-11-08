import FatorRCalculator from "./FatorRCalculator";
import "./index.css";

function App() {
  return (
    <>
      {/* HEADER */}
      <header className="site-header">
        <div className="container nav">
          <a href="#home" className="brand" aria-label="Conta Ágil – início">
            <span className="brand-mark" aria-hidden="true"></span>
            <span>
              Conta<span style={{ color: "var(--blue-700)" }}>Ágil</span>
            </span>
          </a>

          <nav className="nav-links" aria-label="Principal">
            <div className="nav-item">
              <a href="#planos">Planos</a>
            </div>
            <div className="nav-item">
              <a href="#servicos">Serviços ▾</a>
              <div className="dropdown" role="menu" aria-label="Serviços">
                <a href="#s-1">Abertura de empresa</a>
                <a href="#s-2">Contabilidade mensal</a>
                <a href="#s-3">Folha de pagamento</a>
              </div>
            </div>
            <div className="nav-item">
              <a href="#ferramentas">Ferramentas ▾</a>
              <div className="dropdown" role="menu" aria-label="Ferramentas">
                <a href="#cnaes">Consultor de CNAES</a>
                <a href="#fator-r">Calculadora Fator R</a>
                <a href="#clt-pj">Comparador CLT × PJ</a>
              </div>
            </div>
            <div className="nav-item">
              <a href="#blog">Blog</a>
            </div>
            <div className="nav-item">
              <a href="#contato">Contato</a>
            </div>
          </nav>

          <div className="spacer"></div>
          <a className="login" href="#login">
            Login 🔒
          </a>
          <a className="cta" href="#abrir">
            ABRIR EMPRESA GRÁTIS
          </a>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="hero">
        <div className="container hero-grid">
          <div>
            <h1>A praticidade e segurança de uma contabilidade digital</h1>
            <p>
              Protótipo React integrado com a Calculadora Fator R para teste de
              navegação.
            </p>
            <div className="actions">
              <a className="btn btn-primary" href="#abrir">
                ABRIR EMPRESA
              </a>
              <a className="btn btn-secondary" href="#trocar">
                TROCAR DE CONTADOR
              </a>
            </div>
          </div>
          <div className="screen"></div>
        </div>
      </section>

      <div className="strip">
        Ainda não contratou a ContaÁgil? Fale agora com um especialista!
      </div>

      {/* MAIN CONTENT */}
      <main className="container">
        <div className="card" id="cnaes">
          <h2>Consultor de CNAES (placeholder)</h2>
          <p className="muted">
            Aqui ficará a ferramenta real quando você decidir implementá-la.
          </p>
        </div>

        <div className="card" id="fator-r" style={{ marginTop: "24px" }}>
          <h2>Calculadora Fator R</h2>
          <FatorRCalculator />
        </div>

        <div className="card" id="clt-pj" style={{ marginTop: "24px" }}>
          <h2>Comparador CLT × PJ (em breve)</h2>
          <p className="muted">
            Esta seção também receberá o componente final futuramente.
          </p>
        </div>
      </main>
    </>
  );
}

export default App;

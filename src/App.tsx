import './App.css'

function App() {
  return (
    <div className="page">
      <main className="content" />
      <footer className="footer">
        <div className="footerInner">
          <span className="brand">lifty</span>
          <span className="dot" aria-hidden="true">
            ·
          </span>
          <span className="meta">
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  )
}

export default App

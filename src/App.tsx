import { useEffect, useMemo, useState } from 'react'
import './App.css'

const LB_PER_KG = 2.2046226218

type Field = 'total' | 'bar' | 'plates'
type Unit = 'kg' | 'lb'

function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function kgToLb(kg: number) {
  return kg * LB_PER_KG
}

function lbToKg(lb: number) {
  return lb / LB_PER_KG
}

function formatNumber(n: number, fractionDigits: number) {
  if (!Number.isFinite(n)) return ''
  return n.toFixed(fractionDigits)
}

function parseNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function App() {
  const [activeField, setActiveField] = useState<Field>('total')
  const [editing, setEditing] = useState<{ field: Field; unit: Unit } | null>(
    null,
  )

  const [totalKg, setTotalKg] = useState(100)
  const [barKg, setBarKg] = useState(20)
  const [platesPerSideKg, setPlatesPerSideKg] = useState(() =>
    clampNonNegative((100 - 20) / 2),
  )

  const [totalKgText, setTotalKgText] = useState(() => formatNumber(100, 2))
  const [totalLbText, setTotalLbText] = useState(() =>
    formatNumber(kgToLb(100), 2),
  )
  const [barKgText, setBarKgText] = useState(() => formatNumber(20, 2))
  const [barLbText, setBarLbText] = useState(() =>
    formatNumber(kgToLb(20), 2),
  )
  const [platesKgText, setPlatesKgText] = useState(() =>
    formatNumber(clampNonNegative((100 - 20) / 2), 2),
  )
  const [platesLbText, setPlatesLbText] = useState(() =>
    formatNumber(kgToLb(clampNonNegative((100 - 20) / 2)), 2),
  )

  const warning = useMemo(() => {
    return totalKg < barKg
  }, [totalKg, barKg])

  useEffect(() => {
    if (!(editing?.field === 'total' && editing.unit === 'kg')) {
      setTotalKgText(formatNumber(totalKg, 2))
    }
    if (!(editing?.field === 'total' && editing.unit === 'lb')) {
      setTotalLbText(formatNumber(kgToLb(totalKg), 2))
    }
  }, [editing, totalKg])

  useEffect(() => {
    if (!(editing?.field === 'bar' && editing.unit === 'kg')) {
      setBarKgText(formatNumber(barKg, 2))
    }
    if (!(editing?.field === 'bar' && editing.unit === 'lb')) {
      setBarLbText(formatNumber(kgToLb(barKg), 2))
    }
  }, [barKg, editing])

  useEffect(() => {
    if (!(editing?.field === 'plates' && editing.unit === 'kg')) {
      setPlatesKgText(formatNumber(platesPerSideKg, 2))
    }
    if (!(editing?.field === 'plates' && editing.unit === 'lb')) {
      setPlatesLbText(formatNumber(kgToLb(platesPerSideKg), 2))
    }
  }, [editing, platesPerSideKg])

  const recalcPlatesFromTotal = (nextTotalKg: number, nextBarKg: number) => {
    const platesTotalKg = clampNonNegative(nextTotalKg - nextBarKg)
    return platesTotalKg / 2
  }

  const recalcTotalFromPlates = (nextPlatesPerSideKg: number, nextBarKg: number) => {
    return clampNonNegative(nextBarKg + 2 * nextPlatesPerSideKg)
  }

  const setTotal = (nextTotalKg: number) => {
    const normalizedTotalKg = clampNonNegative(nextTotalKg)
    setActiveField('total')
    setTotalKg(normalizedTotalKg)
    setPlatesPerSideKg(recalcPlatesFromTotal(normalizedTotalKg, barKg))
  }

  const setPlates = (nextPlatesPerSideKg: number) => {
    const normalizedPlatesKg = clampNonNegative(nextPlatesPerSideKg)
    setActiveField('plates')
    setPlatesPerSideKg(normalizedPlatesKg)
    setTotalKg(recalcTotalFromPlates(normalizedPlatesKg, barKg))
  }

  const setBar = (nextBarKg: number) => {
    const normalizedBarKg = clampNonNegative(nextBarKg)
    setBarKg(normalizedBarKg)

    if (activeField === 'total') {
      setPlatesPerSideKg(recalcPlatesFromTotal(totalKg, normalizedBarKg))
    } else {
      setTotalKg(recalcTotalFromPlates(platesPerSideKg, normalizedBarKg))
    }
  }

  return (
    <div className="page">
      <main className="content">
        <div className="container">
          <header className="header">
            <h1 className="title">lifty</h1>
            <p className="subtitle">
              Simple lbs ↔ kgs conversions and barbell plate math.
            </p>
          </header>

          <section className="card" aria-label="Calculator">
            <div className="row">
              <div className="rowLabel">
                <div className="rowTitle">Total</div>
                <div className="rowHint">Target loaded weight</div>
              </div>
              <div className="rowFields">
                <label className="field">
                  <span className="unit">kg</span>
                  <input
                    inputMode="decimal"
                    value={totalKgText}
                    onFocus={() => setEditing({ field: 'total', unit: 'kg' })}
                    onBlur={() => setEditing(null)}
                    onChange={(e) => {
                      const v = e.target.value
                      setTotalKgText(v)
                      const n = parseNumber(v)
                      if (n !== null) setTotal(n)
                    }}
                  />
                </label>
                <label className="field">
                  <span className="unit">lb</span>
                  <input
                    inputMode="decimal"
                    value={totalLbText}
                    onFocus={() => setEditing({ field: 'total', unit: 'lb' })}
                    onBlur={() => setEditing(null)}
                    onChange={(e) => {
                      const v = e.target.value
                      setTotalLbText(v)
                      const n = parseNumber(v)
                      if (n !== null) setTotal(lbToKg(n))
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="row">
              <div className="rowLabel">
                <div className="rowTitle">Bar</div>
                <div className="rowHint">Only affects plates</div>
              </div>
              <div className="rowFields">
                <label className="field">
                  <span className="unit">kg</span>
                  <input
                    inputMode="decimal"
                    value={barKgText}
                    onFocus={() => setEditing({ field: 'bar', unit: 'kg' })}
                    onBlur={() => setEditing(null)}
                    onChange={(e) => {
                      const v = e.target.value
                      setBarKgText(v)
                      const n = parseNumber(v)
                      if (n !== null) setBar(n)
                    }}
                  />
                </label>
                <label className="field">
                  <span className="unit">lb</span>
                  <input
                    inputMode="decimal"
                    value={barLbText}
                    onFocus={() => setEditing({ field: 'bar', unit: 'lb' })}
                    onBlur={() => setEditing(null)}
                    onChange={(e) => {
                      const v = e.target.value
                      setBarLbText(v)
                      const n = parseNumber(v)
                      if (n !== null) setBar(lbToKg(n))
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="row">
              <div className="rowLabel">
                <div className="rowTitle">Plates per side</div>
                <div className="rowHint">
                  (Total − Bar) / 2
                </div>
              </div>
              <div className="rowFields">
                <label className="field">
                  <span className="unit">kg</span>
                  <input
                    inputMode="decimal"
                    value={platesKgText}
                    onFocus={() => setEditing({ field: 'plates', unit: 'kg' })}
                    onBlur={() => setEditing(null)}
                    onChange={(e) => {
                      const v = e.target.value
                      setPlatesKgText(v)
                      const n = parseNumber(v)
                      if (n !== null) setPlates(n)
                    }}
                  />
                </label>
                <label className="field">
                  <span className="unit">lb</span>
                  <input
                    inputMode="decimal"
                    value={platesLbText}
                    onFocus={() => setEditing({ field: 'plates', unit: 'lb' })}
                    onBlur={() => setEditing(null)}
                    onChange={(e) => {
                      const v = e.target.value
                      setPlatesLbText(v)
                      const n = parseNumber(v)
                      if (n !== null) setPlates(lbToKg(n))
                    }}
                  />
                </label>
              </div>
            </div>

            {warning ? (
              <div className="warning" role="status">
                Total is below bar weight; plates per side set to 0.
              </div>
            ) : null}

            <div className="metaRow">
              <span className="metaPill">
                Editing: <strong>{activeField === 'total' ? 'Total' : 'Plates'}</strong>
              </span>
            </div>
          </section>
        </div>
      </main>
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

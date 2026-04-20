import { useEffect, useMemo, useState } from 'react'
import './App.css'

const LB_PER_KG = 2.2046226218

const STORAGE_KEY = 'lifty.calculator'
const STORAGE_VERSION = 1

const DEFAULT_TOTAL_KG = 100
const DEFAULT_BAR_KG = 20

type Field = 'total' | 'bar' | 'plates'
type Unit = 'kg' | 'lb'

type StoredCalculatorState = {
  version: number
  activeField: Field
  totalKg: number
  barKg: number
  platesPerSideKg: number
  totalKgText: string
  totalLbText: string
  barKgText: string
  barLbText: string
  platesKgText: string
  platesLbText: string
}

type LoadedCalculatorState = Omit<StoredCalculatorState, 'version'>

function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function recalcPlatesFromTotal(totalKg: number, barKg: number) {
  const platesTotalKg = clampNonNegative(totalKg - barKg)
  return platesTotalKg / 2
}

function recalcTotalFromPlates(platesPerSideKg: number, barKg: number) {
  return clampNonNegative(barKg + 2 * platesPerSideKg)
}

function parseStoredNumber(value: unknown, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? clampNonNegative(n) : fallback
}

function storedText(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
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

function loadStoredCalculatorState(): LoadedCalculatorState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<StoredCalculatorState>
    if (data.version != null && data.version !== STORAGE_VERSION) {
      return null
    }

    const barKg = parseStoredNumber(data.barKg, DEFAULT_BAR_KG)
    const totalKgIn = parseStoredNumber(data.totalKg, DEFAULT_TOTAL_KG)
    const platesIn = parseStoredNumber(data.platesPerSideKg, 0)
    const activeField: Field =
      data.activeField === 'plates' ? 'plates' : 'total'

    let totalKg = totalKgIn
    let platesPerSideKg = platesIn

    if (activeField === 'total') {
      platesPerSideKg = recalcPlatesFromTotal(totalKg, barKg)
    } else {
      totalKg = recalcTotalFromPlates(platesPerSideKg, barKg)
    }

    return {
      activeField,
      totalKg,
      barKg,
      platesPerSideKg,
      totalKgText: storedText(data.totalKgText, formatNumber(totalKg, 2)),
      totalLbText: storedText(
        data.totalLbText,
        formatNumber(kgToLb(totalKg), 2),
      ),
      barKgText: storedText(data.barKgText, formatNumber(barKg, 2)),
      barLbText: storedText(data.barLbText, formatNumber(kgToLb(barKg), 2)),
      platesKgText: storedText(
        data.platesKgText,
        formatNumber(platesPerSideKg, 2),
      ),
      platesLbText: storedText(
        data.platesLbText,
        formatNumber(kgToLb(platesPerSideKg), 2),
      ),
    }
  } catch {
    return null
  }
}

function getInitialCalculatorState(): LoadedCalculatorState {
  const loaded = loadStoredCalculatorState()
  if (loaded) return loaded

  const barKg = DEFAULT_BAR_KG
  const totalKg = DEFAULT_TOTAL_KG
  const platesPerSideKg = recalcPlatesFromTotal(totalKg, barKg)
  return {
    activeField: 'total',
    totalKg,
    barKg,
    platesPerSideKg,
    totalKgText: formatNumber(totalKg, 2),
    totalLbText: formatNumber(kgToLb(totalKg), 2),
    barKgText: formatNumber(barKg, 2),
    barLbText: formatNumber(kgToLb(barKg), 2),
    platesKgText: formatNumber(platesPerSideKg, 2),
    platesLbText: formatNumber(kgToLb(platesPerSideKg), 2),
  }
}

function parseNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function App() {
  const initial = getInitialCalculatorState()

  const [activeField, setActiveField] = useState<Field>(initial.activeField)
  const [editing, setEditing] = useState<{ field: Field; unit: Unit } | null>(
    null,
  )

  const [totalKg, setTotalKg] = useState(initial.totalKg)
  const [barKg, setBarKg] = useState(initial.barKg)
  const [platesPerSideKg, setPlatesPerSideKg] = useState(
    initial.platesPerSideKg,
  )

  const [totalKgText, setTotalKgText] = useState(initial.totalKgText)
  const [totalLbText, setTotalLbText] = useState(initial.totalLbText)
  const [barKgText, setBarKgText] = useState(initial.barKgText)
  const [barLbText, setBarLbText] = useState(initial.barLbText)
  const [platesKgText, setPlatesKgText] = useState(initial.platesKgText)
  const [platesLbText, setPlatesLbText] = useState(initial.platesLbText)

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

  useEffect(() => {
    const payload: StoredCalculatorState = {
      version: STORAGE_VERSION,
      activeField,
      totalKg,
      barKg,
      platesPerSideKg,
      totalKgText,
      totalLbText,
      barKgText,
      barLbText,
      platesKgText,
      platesLbText,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* private mode / quota */
    }
  }, [
    activeField,
    totalKg,
    barKg,
    platesPerSideKg,
    totalKgText,
    totalLbText,
    barKgText,
    barLbText,
    platesKgText,
    platesLbText,
  ])

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

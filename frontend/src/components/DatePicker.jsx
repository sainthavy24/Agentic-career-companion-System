import { useState, useRef, useEffect } from 'react'

const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function fmtDate(v, monthOnly) {
  if (!v) return ''
  const parts = v.split('-')
  const y = +parts[0], m = +parts[1] - 1, d = +parts[2]
  if (monthOnly || !d) return `${MS[m]} ${y}`
  return `${String(d).padStart(2, '0')} ${MS[m]} ${y}`
}

export default function DatePicker({ value, onChange, monthOnly = false, placeholder = 'Select date' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const base = value ? new Date(value.length === 7 ? value + '-01' : value) : new Date()
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() })
  const [pickYear, setPickYear] = useState(false)

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function shiftMonth(d) {
    setView(v => { let m = v.m + d, y = v.y; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } return { y, m } })
  }
  function emit(y, m, d) {
    const mm = String(m + 1).padStart(2, '0')
    onChange(monthOnly ? `${y}-${mm}` : `${y}-${mm}-${String(d).padStart(2, '0')}`)
    setOpen(false)
  }

  const first = new Date(view.y, view.m, 1).getDay()
  const days = new Date(view.y, view.m + 1, 0).getDate()
  const sel = value ? new Date(value.length === 7 ? value + '-01' : value) : null
  const isSel = d => sel && sel.getFullYear() === view.y && sel.getMonth() === view.m && (monthOnly || sel.getDate() === d)
  const years = []
  for (let y = view.y + 6; y >= view.y - 9; y--) years.push(y)

  return (
    <div className="dp" ref={ref}>
      <button type="button" className={`dp-input ${value ? '' : 'ph'}`} onClick={() => setOpen(o => !o)}>
        <span>{value ? fmtDate(value, monthOnly) : placeholder}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
      </button>

      {open && (
        <div className="dp-pop">
          <div className="dp-head">
            <button type="button" className="dp-nav" onClick={() => pickYear ? setView(v => ({ ...v, y: v.y - 15 })) : shiftMonth(-1)}>‹</button>
            <button type="button" className="dp-title" onClick={() => setPickYear(p => !p)}>
              {pickYear ? 'Pick year' : monthOnly ? view.y : `${MN[view.m]} ${view.y}`}
            </button>
            <button type="button" className="dp-nav" onClick={() => pickYear ? setView(v => ({ ...v, y: v.y + 15 })) : shiftMonth(1)}>›</button>
          </div>

          {pickYear ? (
            <div className="dp-grid yr">
              {years.map(y => (
                <button type="button" key={y} className={`dp-cell ${y === view.y ? 'sel' : ''}`} onClick={() => { setView(v => ({ ...v, y })); setPickYear(false) }}>{y}</button>
              ))}
            </div>
          ) : monthOnly ? (
            <div className="dp-grid mo">
              {MS.map((m, i) => (
                <button type="button" key={m} className={`dp-cell ${isSel() && view.m === i ? 'sel' : ''}`} onClick={() => emit(view.y, i, 1)}>{m}</button>
              ))}
            </div>
          ) : (
            <>
              <div className="dp-wd">{WD.map(w => <span key={w}>{w}</span>)}</div>
              <div className="dp-grid">
                {Array.from({ length: first }).map((_, i) => <span key={'e' + i} />)}
                {Array.from({ length: days }).map((_, i) => {
                  const d = i + 1
                  return <button type="button" key={d} className={`dp-cell ${isSel(d) ? 'sel' : ''}`} onClick={() => emit(view.y, view.m, d)}>{d}</button>
                })}
              </div>
            </>
          )}

          <div className="dp-foot">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }}>Clear</button>
            <button type="button" onClick={() => { const t = new Date(); emit(t.getFullYear(), t.getMonth(), t.getDate()) }}>Today</button>
          </div>
        </div>
      )}
    </div>
  )
}

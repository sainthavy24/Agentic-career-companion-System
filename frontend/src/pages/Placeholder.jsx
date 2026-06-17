export default function Placeholder({ title, color, phase, desc }) {
  return (
    <div>
      <div className="topbar"><h1>{title}</h1><span className="badge" style={{ background: color }}>{phase}</span></div>
      <div className="panel">
        <p>{desc}</p>
        <p className="muted">This screen will be built in {phase}.</p>
      </div>
    </div>
  )
}

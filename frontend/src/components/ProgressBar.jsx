export default function ProgressBar({ value, color }) {
  return (
    <div className="progress-track">
      <span style={{ width: value, background: color }} />
    </div>
  );
}

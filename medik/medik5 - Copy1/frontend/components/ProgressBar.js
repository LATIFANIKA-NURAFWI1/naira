export default function ProgressBar({ value = 0, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-cream rounded-full h-3 overflow-hidden">
      <div
        className="h-3 bg-health transition-all duration-500"
        style={{ width: pct + '%', backgroundImage: 'linear-gradient(90deg, #4CAF50, #FFFBEA)' }}
      />
    </div>
  );
}

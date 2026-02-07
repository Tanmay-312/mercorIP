interface SimpleProgressProps {
  value: number;
  className?: string;
}

export function SimpleProgress({ value, className = '' }: SimpleProgressProps) {
  return (
    <div className={`w-full h-2 bg-slate-700 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

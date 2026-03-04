"use client";

interface GaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: "default" | "success" | "warning" | "error" | "info";
}

export function Gauge({ value, max, label, unit = "%", color = "default" }: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    default: "stroke-tropical-indigo",
    success: "stroke-green-500",
    warning: "stroke-yellow-500",
    error: "stroke-red-500",
    info: "stroke-blue-500",
  };

  const getColor = () => {
    if (color !== "default") return colorClasses[color];
    if (percentage >= 90) return colorClasses.error;
    if (percentage >= 70) return colorClasses.warning;
    return colorClasses.success; // Green for healthy values
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full h-full">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--night-lighter)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            className={`${getColor()} transition-all duration-500`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.51327} 251.327`}
            style={{
              strokeDashoffset: 0,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-[var(--lavender)]">
            {label || `${Math.round(value)}${unit}`}
          </span>
        </div>
      </div>
    </div>
  );
}

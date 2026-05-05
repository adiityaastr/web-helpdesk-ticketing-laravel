type IconProps = {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
};

export default function Icon({ name, size = 20, filled = false, className }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ''}`}
      style={{
        fontSize: `${size}px`,
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
      }}
    >
      {name}
    </span>
  );
}
import { clsx } from 'clsx';

interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number | string;
}

export function Icon({ name, filled, className, size = 24 }: IconProps) {
  return (
    <span
      aria-hidden
      className={clsx(
        'material-symbols-outlined leading-none select-none',
        filled && 'filled',
        className,
      )}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}

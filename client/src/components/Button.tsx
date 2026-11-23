import type { ComponentPropsWithoutRef } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'danger' | 'secondary';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'primary',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}

import { ComponentProps } from 'react';

interface AvatarProps extends ComponentProps<'div'> {
  name?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'squircle';
}

export default function Avatar({
  name,
  avatarUrl,
  size = 'md',
  shape = 'circle',
  className = '',
  ...props
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    squircle: 'rounded-[14px]',
  };

  const baseClasses = "overflow-hidden bg-gradient-to-br from-[#11B886] to-[#0D9068] flex items-center justify-center text-white font-bold shrink-0";
  const mergedClasses = `${baseClasses} ${sizeClasses[size]} ${shapeClasses[shape]} ${className}`;

  return (
    <div className={mergedClasses} {...props}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span>{name?.[0] || 'U'}</span>
      )}
    </div>
  );
}

"use client";

import Image from 'next/image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'medium', showText = false, className = '' }: LogoProps) {
  const sizes = {
    small: 32,
    medium: 64,
    large: 128,
  };

  const width = sizes[size];
  const height = sizes[size];

  if (showText) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Image
          src="/logo-icon.svg"
          alt="TradeBot Logo"
          width={width}
          height={height}
          className="flex-shrink-0"
        />
        <Image
          src="/logo-text.svg"
          alt="TradeBot"
          width={200}
          height={60}
          className="h-auto"
        />
      </div>
    );
  }

  return (
    <Image
      src="/logo.svg"
      alt="TradeBot Logo"
      width={width}
      height={height}
      className={className}
    />
  );
}


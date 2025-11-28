/**
 * Quest Logo Component
 * Displays the Quest logo with automatic dark/light mode support
 * Uses CSS filter to invert the white logo for light mode
 */

import { cn } from '../../lib/utils';

interface QuestLogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function QuestLogo({
  className,
  width = 50,
  height,
  alt = 'Quest Logo'
}: QuestLogoProps) {
  return (
    <img
      src="/quest-logo-transparent.png"
      alt={alt}
      width={width}
      height={height}
      className={cn(
        // Invert the white logo to dark in light mode, keep white in dark mode
        'dark:invert-0 invert brightness-0 dark:brightness-100',
        className
      )}
    />
  );
}

export default QuestLogo;

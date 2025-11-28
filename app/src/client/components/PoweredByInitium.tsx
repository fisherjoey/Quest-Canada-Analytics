import initiumLogoDark from '../../../public/initium-logo-dark.png';
import initiumLogoLight from '../../../public/initium-logo-light.png';

interface PoweredByInitiumProps {
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
}

export default function PoweredByInitium({ variant = 'auto', className = '' }: PoweredByInitiumProps) {
  const getLogo = () => {
    if (variant === 'light') return initiumLogoLight;
    if (variant === 'dark') return initiumLogoDark;
    // Auto: use dark logo (works on light backgrounds, which is most common)
    return initiumLogoDark;
  };

  return (
    <div className={`flex items-center justify-center gap-2 py-4 text-sm text-gray-500 ${className}`}>
      <span>Powered by</span>
      <a
        href="https://initiumsolutions.ca"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <img
          src={getLogo()}
          alt="Initium Solutions"
          className="h-6 w-auto"
        />
      </a>
    </div>
  );
}

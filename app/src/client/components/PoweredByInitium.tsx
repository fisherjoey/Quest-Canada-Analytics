import initiumLogoDark from '../../../public/initium-logo-dark.png';
import initiumLogoLight from '../../../public/initium-logo-light.png';

interface PoweredByInitiumProps {
  className?: string;
}

export default function PoweredByInitium({ className = '' }: PoweredByInitiumProps) {
  return (
    <div className={`flex items-center justify-center gap-2 py-4 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      <span>Powered by</span>
      <a
        href="https://initiumsolutions.ca"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        {/* Dark logo for light mode, light logo for dark mode */}
        <img
          src={initiumLogoDark}
          alt="Initium Solutions"
          className="h-6 w-auto dark:hidden"
        />
        <img
          src={initiumLogoLight}
          alt="Initium Solutions"
          className="h-6 w-auto hidden dark:block"
        />
      </a>
    </div>
  );
}

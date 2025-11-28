import { ReactNode } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import PoweredByInitium from '../client/components/PoweredByInitium';
import { QuestLogo } from '../client/components/QuestLogo';

export function AuthPageLayout({children} : {children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        {/* Logo */}
        <WaspRouterLink to={routes.LandingPageRoute.to} className='flex justify-center mb-6'>
          <QuestLogo className='h-16 w-auto' alt='Quest Canada' />
        </WaspRouterLink>

        {/* Auth Card */}
        <div className='bg-card text-card-foreground py-8 px-4 shadow-xl ring-1 ring-border sm:rounded-lg sm:px-10'>
          { children }
        </div>

        {/* Powered By Footer */}
        <PoweredByInitium className='mt-6' />
      </div>
    </div>
  );
}

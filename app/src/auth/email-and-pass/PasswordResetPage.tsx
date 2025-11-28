import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { ResetPasswordForm } from 'wasp/client/auth';
import { AuthPageLayout } from '../AuthPageLayout';

export function PasswordResetPage() {
  return (
    <AuthPageLayout>
      <ResetPasswordForm />
      <br />
      <span className='text-sm font-medium text-foreground'>
        If everything is okay,{' '}
        <WaspRouterLink to={routes.LoginRoute.to} className='underline text-primary hover:text-primary/80'>
          go to login
        </WaspRouterLink>
      </span>
    </AuthPageLayout>
  );
}

import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { SignupForm } from 'wasp/client/auth';
import { AuthPageLayout } from './AuthPageLayout';

export function Signup() {
  return (
    <AuthPageLayout>
      <SignupForm />
      <br />
      <span className='text-sm font-medium text-foreground'>
        I already have an account (
        <WaspRouterLink to={routes.LoginRoute.to} className='underline text-primary hover:text-primary/80'>
          go to login
        </WaspRouterLink>
        ).
      </span>
      <br />
    </AuthPageLayout>
  );
}

import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import bannerDark from '../../../public/banner-dark.svg';
import bannerLight from '../../../public/banner-light.svg';
import { Button } from '../../components/ui/button';

export default function Hero() {
  return (
    <div className='relative pt-14 w-full'>
      <TopGradient />
      <BottomGradient />
      <div className='md:p-24'>
        <div className='mx-auto max-w-8xl px-6 lg:px-8'>
          <div className='lg:mb-18 mx-auto max-w-3xl text-center'>
            <h1 className='text-5xl font-bold text-foreground sm:text-6xl'>
              Supporting Canadian Communities on the <span className='italic'>Pathway</span> to{' '}
              <span className='text-gradient-primary'>Net-Zero</span>
            </h1>
            <p className='mt-6 mx-auto max-w-2xl text-lg leading-8 text-muted-foreground'>
              Track, measure, and report on community-scale climate action with integrated energy solutions 
              and smart community planning tools.
            </p>
            <div className='mt-10 flex items-center justify-center gap-x-6'>
              <Button size='lg' variant='outline' asChild>
                <WaspRouterLink to={routes.AssessmentsRoute.to}>View Assessments</WaspRouterLink>
              </Button>
              <Button size='lg' variant='default' asChild>
                <WaspRouterLink to={routes.SignupRoute.to}>
                  Get Started <span aria-hidden='true'>→</span>
                </WaspRouterLink>
              </Button>
            </div>
          </div>
          <div className='mt-14 flow-root sm:mt-14'>
            <div className='hidden md:flex m-2 justify-center rounded-xl lg:-m-4 lg:rounded-2xl lg:p-4'>
              <img
                src={bannerLight}
                alt='Quest Canada Platform'
                width={1000}
                height={530}
                loading='lazy'
                className='rounded-md shadow-2xl ring-1 ring-gray-900/10 dark:hidden'
              />
              <img
                src={bannerDark}
                alt='Quest Canada Platform'
                width={1000}
                height={530}
                loading='lazy'
                className='rounded-md shadow-2xl ring-1 ring-gray-900/10 hidden dark:block'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopGradient() {
  return (
    <div
      className='absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80'
      aria-hidden='true'
    >
      <div
        className='relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-secondary to-primary opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]'
        style={{
          clipPath:
            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
        }}
      />
    </div>
  );
}

function BottomGradient() {
  return (
    <div
      className='absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]'
      aria-hidden='true'
    >
      <div
        className='relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-secondary to-primary opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]'
        style={{
          clipPath:
            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
        }}
      />
    </div>
  );
}

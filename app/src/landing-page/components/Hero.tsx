import { Link as WaspRouterLink, routes } from 'wasp/client/router';
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
              <HeroIllustration />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className='w-full max-w-4xl mx-auto'>
      <svg
        viewBox='0 0 800 400'
        className='w-full h-auto'
        aria-label='Community energy visualization'
      >
        <defs>
          {/* Gradients */}
          <linearGradient id='skyGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' className='[stop-color:hsl(var(--primary)/0.1)]' />
            <stop offset='100%' className='[stop-color:hsl(var(--background))]' />
          </linearGradient>
          <linearGradient id='sunGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#fbbf24' />
            <stop offset='100%' stopColor='#f59e0b' />
          </linearGradient>
          <linearGradient id='leafGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' className='[stop-color:hsl(var(--primary))]' />
            <stop offset='100%' className='[stop-color:hsl(var(--primary)/0.7)]' />
          </linearGradient>
          <linearGradient id='buildingGradient' x1='0%' y1='100%' x2='0%' y2='0%'>
            <stop offset='0%' className='[stop-color:hsl(var(--muted))]' />
            <stop offset='100%' className='[stop-color:hsl(var(--muted-foreground)/0.3)]' />
          </linearGradient>

          {/* Glow filter */}
          <filter id='glow'>
            <feGaussianBlur stdDeviation='3' result='coloredBlur' />
            <feMerge>
              <feMergeNode in='coloredBlur' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width='800' height='400' fill='url(#skyGradient)' rx='12' />

        {/* Sun with rays */}
        <g className='animate-pulse' style={{ animationDuration: '4s' }}>
          <circle cx='650' cy='80' r='40' fill='url(#sunGradient)' filter='url(#glow)' />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1={650 + Math.cos((angle * Math.PI) / 180) * 50}
              y1={80 + Math.sin((angle * Math.PI) / 180) * 50}
              x2={650 + Math.cos((angle * Math.PI) / 180) * 65}
              y2={80 + Math.sin((angle * Math.PI) / 180) * 65}
              stroke='#fbbf24'
              strokeWidth='3'
              strokeLinecap='round'
              opacity='0.6'
            />
          ))}
        </g>

        {/* Ground/horizon line */}
        <path
          d='M0 320 Q200 300 400 310 Q600 320 800 305 L800 400 L0 400 Z'
          className='fill-[hsl(var(--primary)/0.15)]'
        />

        {/* Wind turbines */}
        <g>
          {/* Turbine 1 */}
          <rect x='118' y='180' width='4' height='140' className='fill-[hsl(var(--muted-foreground)/0.4)]' />
          <g className='origin-[120px_180px] animate-spin' style={{ animationDuration: '8s' }}>
            <path d='M120 180 L120 130 L125 175 Z' className='fill-[hsl(var(--foreground)/0.6)]' />
            <path d='M120 180 L155 205 L125 185 Z' className='fill-[hsl(var(--foreground)/0.6)]' />
            <path d='M120 180 L85 205 L115 185 Z' className='fill-[hsl(var(--foreground)/0.6)]' />
          </g>
          <circle cx='120' cy='180' r='6' className='fill-[hsl(var(--foreground)/0.5)]' />

          {/* Turbine 2 */}
          <rect x='198' y='200' width='4' height='120' className='fill-[hsl(var(--muted-foreground)/0.4)]' />
          <g className='origin-[200px_200px] animate-spin' style={{ animationDuration: '6s' }}>
            <path d='M200 200 L200 155 L205 195 Z' className='fill-[hsl(var(--foreground)/0.6)]' />
            <path d='M200 200 L230 222 L205 205 Z' className='fill-[hsl(var(--foreground)/0.6)]' />
            <path d='M200 200 L170 222 L195 205 Z' className='fill-[hsl(var(--foreground)/0.6)]' />
          </g>
          <circle cx='200' cy='200' r='5' className='fill-[hsl(var(--foreground)/0.5)]' />
        </g>

        {/* Buildings/Community */}
        <g>
          {/* Building 1 - tall */}
          <rect x='300' y='220' width='50' height='100' fill='url(#buildingGradient)' rx='2' />
          <rect x='308' y='230' width='10' height='12' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='332' y='230' width='10' height='12' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='308' y='250' width='10' height='12' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='332' y='250' width='10' height='12' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='308' y='270' width='10' height='12' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='332' y='270' width='10' height='12' className='fill-[hsl(var(--primary)/0.3)]' />
          {/* Solar panels on roof */}
          <rect x='305' y='212' width='18' height='8' className='fill-[hsl(var(--primary)/0.8)]' rx='1' />
          <rect x='327' y='212' width='18' height='8' className='fill-[hsl(var(--primary)/0.8)]' rx='1' />

          {/* Building 2 - medium */}
          <rect x='360' y='250' width='45' height='70' fill='url(#buildingGradient)' rx='2' />
          <rect x='368' y='260' width='8' height='10' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='389' y='260' width='8' height='10' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='368' y='280' width='8' height='10' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='389' y='280' width='8' height='10' className='fill-[hsl(var(--primary)/0.3)]' />
          {/* Solar panels */}
          <rect x='362' y='243' width='38' height='7' className='fill-[hsl(var(--primary)/0.8)]' rx='1' />

          {/* Building 3 - house */}
          <rect x='420' y='270' width='40' height='50' fill='url(#buildingGradient)' rx='2' />
          <path d='M415 270 L440 245 L465 270 Z' fill='url(#buildingGradient)' />
          <rect x='432' y='290' width='16' height='30' className='fill-[hsl(var(--primary)/0.2)]' rx='1' />
          {/* Solar panel on roof */}
          <rect x='425' y='253' width='20' height='10' className='fill-[hsl(var(--primary)/0.8)]' rx='1' transform='rotate(-25 435 258)' />

          {/* Building 4 */}
          <rect x='475' y='240' width='55' height='80' fill='url(#buildingGradient)' rx='2' />
          <rect x='483' y='250' width='12' height='14' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='510' y='250' width='12' height='14' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='483' y='272' width='12' height='14' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='510' y='272' width='12' height='14' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='483' y='294' width='12' height='14' className='fill-[hsl(var(--primary)/0.3)]' />
          <rect x='510' y='294' width='12' height='14' className='fill-[hsl(var(--primary)/0.3)]' />
          {/* Solar panels */}
          <rect x='478' y='232' width='22' height='8' className='fill-[hsl(var(--primary)/0.8)]' rx='1' />
          <rect x='505' y='232' width='22' height='8' className='fill-[hsl(var(--primary)/0.8)]' rx='1' />
        </g>

        {/* Trees */}
        <g>
          {/* Tree 1 */}
          <rect x='555' y='280' width='8' height='40' fill='#8B5A2B' />
          <ellipse cx='559' cy='265' rx='25' ry='30' fill='url(#leafGradient)' />

          {/* Tree 2 */}
          <rect x='600' y='290' width='6' height='30' fill='#8B5A2B' />
          <ellipse cx='603' cy='278' rx='18' ry='22' fill='url(#leafGradient)' />

          {/* Tree 3 */}
          <rect x='640' y='275' width='7' height='45' fill='#8B5A2B' />
          <ellipse cx='644' cy='258' rx='22' ry='28' fill='url(#leafGradient)' />
        </g>

        {/* Energy flow lines (animated) */}
        <g className='opacity-60'>
          <path
            d='M350 215 Q400 150 500 120 Q600 90 650 80'
            fill='none'
            stroke='#fbbf24'
            strokeWidth='2'
            strokeDasharray='8 4'
            className='animate-pulse'
            style={{ animationDuration: '2s' }}
          />
          <path
            d='M120 180 Q200 150 300 170 Q350 180 350 220'
            fill='none'
            className='stroke-[hsl(var(--primary))]'
            strokeWidth='2'
            strokeDasharray='8 4'
            style={{ animation: 'pulse 2.5s infinite' }}
          />
        </g>

        {/* Floating metrics/data points */}
        <g className='animate-pulse' style={{ animationDuration: '3s' }}>
          <circle cx='250' cy='140' r='20' className='fill-[hsl(var(--primary)/0.2)]' />
          <text x='250' y='145' textAnchor='middle' className='fill-[hsl(var(--primary))] text-xs font-bold'>CO2</text>

          <circle cx='380' cy='120' r='22' className='fill-[hsl(var(--primary)/0.2)]' />
          <text x='380' y='117' textAnchor='middle' className='fill-[hsl(var(--primary))] text-[10px] font-bold'>NET</text>
          <text x='380' y='129' textAnchor='middle' className='fill-[hsl(var(--primary))] text-[10px] font-bold'>ZERO</text>

          <circle cx='520' cy='100' r='18' className='fill-[hsl(var(--primary)/0.2)]' />
          <text x='520' y='105' textAnchor='middle' className='fill-[hsl(var(--primary))] text-[10px] font-bold'>GHG</text>
        </g>

        {/* Progress arc */}
        <g transform='translate(700, 320)'>
          <path
            d='M-35 0 A35 35 0 0 1 35 0'
            fill='none'
            className='stroke-[hsl(var(--muted))]'
            strokeWidth='6'
            strokeLinecap='round'
          />
          <path
            d='M-35 0 A35 35 0 0 1 20 -28'
            fill='none'
            className='stroke-[hsl(var(--primary))]'
            strokeWidth='6'
            strokeLinecap='round'
          />
          <text x='0' y='-8' textAnchor='middle' className='fill-[hsl(var(--foreground))] text-xs font-semibold'>75%</text>
          <text x='0' y='5' textAnchor='middle' className='fill-[hsl(var(--muted-foreground))] text-[8px]'>Progress</text>
        </g>
      </svg>
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

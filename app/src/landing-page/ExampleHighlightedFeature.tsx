import HighlightedFeature from './components/HighlightedFeature';
import aiReadyDark from '../client/static/assets/aiready-dark.webp';
import aiReady from '../client/static/assets/aiready.webp';

export default function SmartEnergyCommunities() {
  return (
    <HighlightedFeature
      name='Smart Energy Communities'
      description='Integrated, community-scale energy solutions that support municipalities on their pathway to net-zero through comprehensive planning and tracking tools.'
      highlightedComponent={<SmartEnergyExample />}
      direction='row-reverse'
    />
  );
}

const SmartEnergyExample = () => {
  return (
    <div className='w-full'>
      <img src={aiReady} alt='Smart Energy Systems' className='dark:hidden' />
      <img src={aiReadyDark} alt='Smart Energy Systems' className='hidden dark:block' />
    </div>
  );
};

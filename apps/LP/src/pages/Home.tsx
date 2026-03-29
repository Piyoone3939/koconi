import { HeroSection } from '../components/HeroSection';
import { AboutSection } from '../components/AboutSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { AISection } from '../components/AISection';
import { AlbumSection } from '../components/AlbumSection';
import { PrivacySection } from '../components/PrivacySection';
import { DownloadSection } from '../components/DownloadSection';

export function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AISection />
      <AlbumSection />
      <PrivacySection />
      <DownloadSection />
    </>
  );
}
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { FeaturesSection } from './components/FeaturesSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { AISection } from './components/AISection';
import { AlbumSection } from './components/AlbumSection';
import { PrivacySection } from './components/PrivacySection';
import { DownloadSection } from './components/DownloadSection';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-[#FFFDE7] scroll-smooth">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AISection />
        <AlbumSection />
        <PrivacySection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
}
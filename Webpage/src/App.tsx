import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { AISection } from "./components/AISection";
import { AlbumSection } from "./components/AlbumSection";
import { AboutSection } from "./components/AboutSection";
import { DownloadSection } from "./components/DownloadSection";
import { PrivacySection } from "./components/PrivacySection";
import { Footer } from "./components/Footer";

function App() {
  return (
    <main className="relative overflow-hidden bg-background text-gray-900">
      <Header />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AISection />
      <AlbumSection />
      <PrivacySection />
      <DownloadSection />
      <Footer />

    </main>
  );
}

export default App;

import { useEffect } from 'react';
import { FallingLeaves } from './components/FallingLeaves';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutVeridia } from './components/AboutVeridia';
import { FamiliesSection } from './components/FamiliesSection';
import { AppCTA } from './components/AppCTA';
import { Footer } from './components/Footer';

export default function LandingPage() {
  // Define o título da página
  useEffect(() => {
    document.title = 'Veridia Saber — Portal Botânico';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-950">
      <FallingLeaves />
      {/* Navbar Fixa */}
      <Navbar />

      <main className="flex-grow">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 3. Seção O que é o Veridia Saber */}
        <AboutVeridia />

        {/* 5. Seção Famílias Botânicas */}
        <FamiliesSection />

        {/* 7. CTA do App */}
        <AppCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

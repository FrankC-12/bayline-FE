import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import StatsStrip from "@/components/landing/StatsStrip";
import ModulesPreview from "@/components/landing/ModulesPreview";
import WhyBayline from "@/components/landing/WhyBayline";
import CtaBand from "@/components/landing/CtaBand";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <StatsStrip />
      <ModulesPreview />
      <WhyBayline />
      <CtaBand />
      <Footer />
    </main>
  );
}
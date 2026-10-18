import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Navbar from "@/components/landing/Navbar";
import ProblemSection from "@/components/landing/ProblemSection";
import ReputationSection from "@/components/landing/ReputationSection";

const baloo = Baloo_2({
  subsets: ["latin"],
  display: "swap",
});

const LANDING_PALETTE = {
  "--lp-bg": "#fdf3e7",
  "--lp-card": "#fff9f2",
  "--lp-ink": "#2b2622",
  "--lp-mute": "#7d7268",
  "--lp-line": "#eadbc9",
  "--lp-mint": "#dff0ea",
  "--lp-salmon": "#f5d9d3",
  "--lp-salmon-ink": "#b5482a",
} as CSSProperties;

export const metadata: Metadata = {
  title: "Junior Bridge | Testers junior y emprendedores",
  description:
    "Publica tu proyecto gratis y recibe pruebas de testers junior, o gana experiencia y reputación probando productos reales.",
};

export default function Home() {
  return (
    <div
      style={LANDING_PALETTE}
      className={`${baloo.className} min-h-screen overflow-x-hidden bg-(--lp-bg) leading-normal text-(--lp-ink)`}
    >
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <ReputationSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

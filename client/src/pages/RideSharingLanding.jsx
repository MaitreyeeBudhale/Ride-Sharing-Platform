import React from "react";
import NavBar from "../components/NavBar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Steps from "../components/Steps";
import Stats from "../components/Stats";
import FinalCTA from "../components/FinalCTA";
import Footer from "../components/Footer";
import FONT_IMPORT from "../theme/FONT_IMPORT";

export default function RideShareLanding() {
  return (
    <div className="min-h-screen bg-white text-zinc-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <NavBar />
      <main>
        <Hero />
        <Features />
        <Steps />
        <Stats />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

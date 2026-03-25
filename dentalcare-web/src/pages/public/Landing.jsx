import AboutUs from "../../components/landing/AboutUs";
import ApplicationOverview from "../../components/landing/ApplicationOverview";
import Footer from "../../components/landing/Footer";
import Hero from "../../components/landing/Hero";
import HowItWorks from "../../components/landing/HowItWorks";
import JoinUsNow from "../../components/landing/JoinUsNow";
import Services from "../../components/landing/Services";
import Specialists from "../../components/landing/Specialist";
import WhyChoose from "../../components/landing/WhyChoose";

export default function Landing() {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_#ffd8e8,_#fff3f8_30%,_#fff_70%)] text-slate-800">
      <main className="w-full space-y-6 pb-6">
        <Hero />
        <AboutUs />
        <Services />
        <Specialists />
        <ApplicationOverview />
        <WhyChoose />
        <HowItWorks />
        <JoinUsNow />
      </main>
      <Footer />
    </div>
  );
}
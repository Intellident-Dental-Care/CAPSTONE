import AboutUs from "../../components/landing/AboutUs";
import Footer from "../../components/landing/Footer";
import Hero from "../../components/landing/Hero";
import HowItWorks from "../../components/landing/HowItWorks";
import JoinUsNow from "../../components/landing/JoinUsNow";
import Services from "../../components/landing/Services";
import Specialists from "../../components/landing/Specialist";

export default function Landing() {
  return (
    <div className="w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_#ffd8e8,_#fff3f8_30%,_#fff_70%)] text-slate-800">
      <main className="w-full space-y-4 pb-4 sm:space-y-5 sm:pb-5 lg:space-y-6 lg:pb-6">
        <Hero />
        <AboutUs />
        <Services />
        <Specialists />
        <HowItWorks />
        <JoinUsNow />
      </main>
      <Footer />
    </div>
  );
}
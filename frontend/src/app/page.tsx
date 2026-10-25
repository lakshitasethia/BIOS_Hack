import { Intro } from "@/components/landing/intro";
import { Nav } from "@/components/landing/nav";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Hero } from "@/components/landing/hero-3d";
import { SignalField } from "@/components/landing/signal-field";
import { Introducing } from "@/components/landing/introducing";
import { Impact } from "@/components/landing/impact";
import { Responses } from "@/components/landing/responses";
import { Scenarios } from "@/components/landing/scenarios";
import { Sources } from "@/components/landing/sources";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Intro />
      <Nav />
      <main>
        <Hero />
        <SignalField />
        <Impact />
        <Introducing />
        <Responses />
        <Scenarios />
        <Sources />
      </main>
      <Footer />
    </>
  );
}

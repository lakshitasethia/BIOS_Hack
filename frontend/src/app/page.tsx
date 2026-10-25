import { Intro } from "@/components/landing/intro";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { SignalField } from "@/components/landing/signal-field";
import { Platform } from "@/components/landing/platform";
import { Impact } from "@/components/landing/impact";
import { Responses } from "@/components/landing/responses";
import { Scenarios } from "@/components/landing/scenarios";
import { Sources } from "@/components/landing/sources";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Intro />
      <Nav />
      <main>
        <Hero />
        <SignalField />
        <Platform />
        <Impact />
        <Responses />
        <Scenarios />
        <Sources />
      </main>
      <Footer />
    </>
  );
}

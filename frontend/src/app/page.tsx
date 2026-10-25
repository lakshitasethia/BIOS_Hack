import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { SignalField } from "@/components/landing/signal-field";
import { Platform } from "@/components/landing/platform";
import { Impact } from "@/components/landing/impact";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SignalField />
        <Platform />
        <Impact />
      </main>
    </>
  );
}

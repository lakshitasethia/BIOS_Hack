import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { SignalField } from "@/components/landing/signal-field";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SignalField />
      </main>
    </>
  );
}

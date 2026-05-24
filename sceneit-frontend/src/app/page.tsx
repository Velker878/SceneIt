import { Hero } from "@/components/layout/Hero";
import { MainContent } from "@/components/layout/MainContent";

export default function Home() {
  return (
    <main className="min-h-screen bg-scene-bg">
      <Hero />
      <MainContent />
    </main>
  );
}

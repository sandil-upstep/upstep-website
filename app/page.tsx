import AnandSection from "@/components/AnandSection";
import BookDemoSection from "@/components/BookDemoSection";
import CarouselSection from "@/components/CarouselSection";
import Button from "@/components/common/Button/Button";
import DarkSection from "@/components/DarkSection";
import HeroSection from "@/components/HeroSection";
import ReviewSection from "@/components/ReviewSection";
import ScientificallyStructuredSection from "@/components/ScientificallyStructuredSection";
import SuccessStoriesSection from "@/components/SuccessStoriesSection";
import WhatWeOfferSection from "@/components/WhatWeOfferSection";
import WhyChessSection from "@/components/WhyChessSection";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col font-sans main-cover">
      <HeroSection />
      {/* <DarkSection /> */}
      <AnandSection />
      <WhatWeOfferSection />
      <SuccessStoriesSection />
      <ScientificallyStructuredSection />
      <WhyChessSection />
      <ReviewSection />
      <CarouselSection />
      <BookDemoSection />
    </div>
  );
}

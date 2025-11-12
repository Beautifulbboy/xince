import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AllTests from "./pages/AllTests";
import PsychologicalAgeTest from "./pages/PsychologicalAgeTest";
import MoodThermometerTest from "./pages/MoodThermometerTest";
import FatalismTest from "./pages/FatalismTest";
import MBTITest from "./pages/MBTITest";
import JealousyTest from "./pages/JealousyTest";
import CoupleRelationshipTest from "./pages/CoupleRelationshipTest";
import BeckHopelessnessTest from "./pages/BeckHopelessnessTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tests" element={<AllTests />} />
          <Route path="/test/psychological-age" element={<PsychologicalAgeTest />} />
          <Route path="/test/mood-thermometer" element={<MoodThermometerTest />} />
          <Route path="/test/fatalism" element={<FatalismTest />} />
          <Route path="/test/mbti" element={<MBTITest />} />
          <Route path="/test/jealousy" element={<JealousyTest />} />
          <Route path="/test/couple-relationship" element={<CoupleRelationshipTest />} />
          <Route path="/test/beck-hopelessness" element={<BeckHopelessnessTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

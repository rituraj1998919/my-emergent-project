import React, { useEffect, Component } from "react";
import Lenis from "lenis";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./sections/Navbar";
import Hero from "./sections/Hero";
import Marquee from "./sections/Marquee";
import About from "./sections/About";
import Services from "./sections/Services";
import Portfolio from "./sections/Portfolio";
import Pricing from "./sections/Pricing";
import Trust from "./sections/Trust";
import Reviews from "./sections/Reviews";
import Booking from "./sections/Booking";
import Footer from "./sections/Footer";
import Admin from "./pages/Admin";
import Security from "./pages/Security";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.error("Section error:", err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MainSite() {
  return (
    <div className="relative">
      <div className="grain" aria-hidden="true" />
      <ErrorBoundary>
        <Navbar />
      </ErrorBoundary>
      <main>
        <ErrorBoundary><Hero /></ErrorBoundary>
        <ErrorBoundary><Marquee /></ErrorBoundary>
        <ErrorBoundary><About /></ErrorBoundary>
        <ErrorBoundary><Services /></ErrorBoundary>
        <ErrorBoundary><Portfolio /></ErrorBoundary>
        <ErrorBoundary><Pricing /></ErrorBoundary>
        <ErrorBoundary><Trust /></ErrorBoundary>
        <ErrorBoundary><Reviews /></ErrorBoundary>
        <ErrorBoundary><Booking /></ErrorBoundary>
      </main>
      <ErrorBoundary><Footer /></ErrorBoundary>
    </div>
  );
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/security" element={<Security />} />
        <Route path="*" element={<MainSite />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

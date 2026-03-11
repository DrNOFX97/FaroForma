import { useState, useEffect } from 'react';
import { Navbar, Footer } from './components/layout';
import { Hero, About, Services, Tutoring, Contact, Courses } from './components/sections';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <>
      <Navbar isDark={isDark} onThemeToggle={() => setIsDark(v => !v)} />
      <main>
        <Hero />
        <About />
        <Services />
        <Courses />
        <Tutoring />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AboutPageProps {
  onBack?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const headingColor = dark ? '#ffffff' : '#172554';
  const mutedText = dark ? '#a1a1aa' : '#475569';
  const dividerBorder = dark ? '#27272a' : '#e2e8f0';

  const handleReturn = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState({}, '', '/');
      window.location.href = '/';
    }
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300 font-sans"
      style={{
        background: dark ? '#000000' : '#faf8f5',
        color: dark ? '#ffffff' : '#172554',
      }}
    >
      {/* ── Top Header / Back Navigation Bar ──────────────────────────── */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md transition-colors"
        style={{
          background: dark ? '#000000cc' : '#ffffffcc',
          borderColor: dividerBorder,
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition hover:opacity-80 border cursor-pointer"
            style={{
              background: dark ? '#18181b' : '#faf8f5',
              borderColor: dividerBorder,
              color: headingColor,
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* ── Main Article Container ────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">

        {/* Page Hero Title */}
        <div className="space-y-4 text-center sm:text-left border-b pb-10" style={{ borderColor: dividerBorder }}>
          <h1
            className="font-serif text-4xl sm:text-6xl font-normal tracking-tight leading-[1.05]"
            style={{ color: headingColor }}
          >
            Welcome to F.L.Y (Future Leaders Youth)
          </h1>

          <p
            className="font-serif italic text-xl sm:text-2xl text-opacity-90 tracking-tight leading-snug"
            style={{ color: dark ? '#d4d4d8' : '#1e3a8a' }}
          >
            Empowering tomorrow’s changemakers by bridging the gap between traditional education and real-world life skills.
          </p>
        </div>

        {/* ── Who We Are Section ──────────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight" style={{ color: headingColor }}>
            Who We Are
          </h2>

          <div className="space-y-5 text-base sm:text-lg leading-relaxed font-normal" style={{ color: mutedText }}>
            <p>
              <strong style={{ color: headingColor }}>FL.Y (Future Leaders. YOUTH)</strong> is a youth-driven non-profit initiative dedicated to equipping young people with the essential leadership tools, practical knowledge, and global perspective needed to thrive in a rapidly changing world.
            </p>

            <p>
              While traditional academic curricula build foundational knowledge, FL.Y focuses on actionable empowerment. We believe that leadership isn't reserved for the future, it begins today when young minds are given the right platform, skills, and community support.
            </p>

            <p>
              Through structured community outreach, skill-building workshops, and international diplomatic platforms like <strong style={{ color: headingColor }}>FL.YMUN</strong>, we are cultivating an active, socially conscious, and capable generation of leaders.
            </p>
          </div>
        </section>

        {/* ── Join Us Section ─────────────────────────────────────────── */}
        <section className="space-y-6 pt-4 border-t" style={{ borderColor: dividerBorder }}>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight" style={{ color: headingColor }}>
            Join Us
          </h2>

          <div className="flex flex-col gap-4 max-w-md">
            {/* Join Executive Team Button */}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfHWWoIZ8Rxw8hOqWT_7xUQCJr5uAFMJdIg_paHrx_ZBhI28w/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 hover:opacity-90 shadow-sm active:scale-95 group"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
              }}
            >
              <span>Join our executive team</span>
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* Join as a Volunteer Button */}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSez1-QH0YeiGWv2Jv1gKmi_wFx2y_Q_vWBogvtbkFaZYUV4eg/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 hover:opacity-90 shadow-sm active:scale-95 group"
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #cbd5e1',
              }}
            >
              <span>Join us as a volunteer</span>
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono"
          style={{ borderColor: dividerBorder, color: mutedText }}
        >
          <span>© {new Date().getFullYear()} FUTURE LEADERS YOUTH (FL.Y).</span>
        </footer>

      </main>
    </div>
  );
};

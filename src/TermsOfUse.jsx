import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: 13,
        fontWeight: 900,
        color: '#b09fd4',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 12,
        marginTop: 0,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function TermsOfUse() {
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@400;700;900&display=swap');`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const p = {
    color: '#c0b0e0',
    fontSize: 15,
    lineHeight: 1.75,
    marginTop: 0,
    marginBottom: 12,
    fontFamily: "'Nunito', sans-serif",
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0020', position: 'relative' }}>
      <div
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: 12, left: 16,
          color: '#4a4a6a', fontSize: 12, cursor: 'pointer',
          zIndex: 10, padding: '6px 12px', borderRadius: 6,
          background: '#0a0c2080', border: '1px solid #1a1a3a',
          fontFamily: "'Courier New', monospace", letterSpacing: 2,
        }}
      >
        ← ARCADE
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 100px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
          <h1 style={{
            fontFamily: "'Boogaloo', cursive",
            fontSize: 'clamp(28px, 5vw, 44px)',
            color: '#ffe066',
            margin: '0 0 10px',
          }}>
            Terms of Use
          </h1>
          <p style={{ ...p, color: '#9080b8', fontSize: 13, marginBottom: 4 }}>
            Last updated: April 18, 2026
          </p>
          <p style={{ ...p, color: '#9080b8', fontSize: 13, marginBottom: 0 }}>
            Odd Noodle Games — oddnoodlegames.com
          </p>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, #3a1a6a, transparent)',
          marginBottom: 48,
        }} />

        {/* Short version callout */}
        <div style={{
          background: '#1a0a35',
          borderLeft: '4px solid #ffe066',
          borderRadius: '0 12px 12px 0',
          padding: '16px 20px',
          marginBottom: 48,
        }}>
          <p style={{ ...p, fontWeight: 700, color: '#ffe066', marginBottom: 8 }}>
            The short version
          </p>
          <ul style={{ ...p, margin: 0, paddingLeft: 20 }}>
            <li>Play the games freely — personal, family, and classroom use are all welcome</li>
            <li>Do not copy, redistribute, or host our code or assets</li>
            <li>Do not use this site or its content for commercial purposes without written permission</li>
            <li>All content is © 2026 Odd Noodle Games. All rights reserved.</li>
          </ul>
        </div>

        <Section title="1. Acceptance of Terms">
          <p style={p}>
            By accessing or using oddnoodlegames.com (the "Site"), you agree to be bound by these
            Terms of Use. If you are a parent or guardian allowing a child to use the Site, you
            accept these terms on their behalf. If you do not agree to these terms, please do not
            use the Site.
          </p>
        </Section>

        <Section title="2. Permitted Use">
          <p style={p}>
            The games and content on this Site are provided free of charge for the following
            permitted uses:
          </p>
          <ul style={{ ...p, paddingLeft: 20, marginBottom: 12 }}>
            <li><strong style={{ color: '#d4c8f0' }}>Personal use</strong> — playing the games for your own enjoyment</li>
            <li><strong style={{ color: '#d4c8f0' }}>Family use</strong> — sharing the Site with members of your household</li>
            <li><strong style={{ color: '#d4c8f0' }}>Classroom and educational use</strong> — using the games as part of teaching or learning activities</li>
          </ul>
          <p style={p}>
            You may link to the Site from blogs, social media, or educational resources. No
            permission is needed to share the URL.
          </p>
        </Section>

        <Section title="3. Prohibited Use">
          <p style={p}>
            The following are strictly prohibited without prior written permission from Odd Noodle
            Games:
          </p>
          <ul style={{ ...p, paddingLeft: 20, marginBottom: 12 }}>
            <li>Copying, downloading, or reproducing any source code or game assets</li>
            <li>Redistributing or republishing any content from this Site</li>
            <li>Hosting mirror sites or copies of any game</li>
            <li>Embedding the Site or any game in a frame or iframe on another domain</li>
            <li>Using any content for commercial purposes, resale, or monetisation</li>
            <li>Scraping or automated harvesting of content</li>
            <li>Modifying or creating derivative works based on our code or assets</li>
          </ul>
        </Section>

        <Section title="4. Intellectual Property">
          <p style={p}>
            All content on this Site — including but not limited to game code, artwork, audio,
            graphics, text, and design — is the exclusive property of Odd Noodle Games and is
            protected by copyright and other intellectual property laws.
          </p>
          <p style={p}>
            <strong style={{ color: '#d4c8f0' }}>© 2026 Odd Noodle Games. All rights reserved.</strong>
          </p>
          <p style={p}>
            No licence is granted to copy, use, modify, distribute, or build upon this code or
            these assets without explicit written permission from Odd Noodle Games.
          </p>
        </Section>

        <Section title="5. Disclaimer of Warranties">
          <p style={p}>
            The games and all content on this Site are provided{' '}
            <strong style={{ color: '#d4c8f0' }}>as-is</strong> and{' '}
            <strong style={{ color: '#d4c8f0' }}>as-available</strong>, without warranty of any
            kind, express or implied. Odd Noodle Games makes no guarantees regarding availability,
            accuracy, or fitness for any particular purpose.
          </p>
          <p style={p}>
            We reserve the right to modify, suspend, or discontinue any game or the Site at any
            time without notice.
          </p>
        </Section>

        <Section title="6. Limitation of Liability">
          <p style={p}>
            To the fullest extent permitted by law, Odd Noodle Games shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of — or inability
            to use — the Site or its games.
          </p>
        </Section>

        <Section title="7. Changes to These Terms">
          <p style={p}>
            We may update these Terms of Use at any time. When we do, we will update the "Last
            updated" date at the top of this page. Continued use of the Site after a change
            constitutes acceptance of the revised terms.
          </p>
        </Section>

        <Section title="8. Contact & Licensing Enquiries">
          <p style={p}>
            For licensing enquiries, permissions, or any questions about these terms, please
            contact us at{' '}
            <a href="mailto:hello@oddnoodlegames.com" style={{ color: '#ffe066' }}>
              hello@oddnoodlegames.com
            </a>. We aim to respond within 30 days.
          </p>
        </Section>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #ff3cac, #7c00ff)',
              border: 'none',
              borderRadius: 14,
              color: '#fff',
              fontFamily: "'Boogaloo', cursive",
              fontSize: 20,
              padding: '14px 36px',
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            Back to the games →
          </button>
        </div>

      </div>
    </div>
  );
}

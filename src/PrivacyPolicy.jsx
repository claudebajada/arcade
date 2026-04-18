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

export default function PrivacyPolicy() {
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{
            fontFamily: "'Boogaloo', cursive",
            fontSize: 'clamp(28px, 5vw, 44px)',
            color: '#ffe066',
            margin: '0 0 10px',
          }}>
            Privacy Policy
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
            <li>We do not use advertising trackers, third-party behavioural analytics, or profiling tools</li>
            <li>We collect limited technical server logs to operate, secure, and monitor the service</li>
            <li>We do not use cookies or advertising tracking of any kind</li>
            <li>We do not run ads</li>
            <li>We do not require accounts or sign-ups</li>
            <li>All games run entirely in your browser</li>
            <li>Google Fonts loads fonts from Google's servers — that's the only external request (see Section 4)</li>
          </ul>
        </div>

        {/* Section 1 */}
        <Section title="1. Who We Are">
          <p style={p}>
            Odd Noodle Games operates the website at{' '}
            <span style={{ color: '#ffe066' }}>oddnoodlegames.com</span> — a free arcade of
            educational browser games for children. For privacy-related enquiries, you can contact
            us at{' '}
            <a href="mailto:privacy@oddnoodlegames.com" style={{ color: '#ffe066' }}>
              privacy@oddnoodlegames.com
            </a>.
          </p>
          <p style={p}>
            For the purposes of the General Data Protection Regulation (GDPR), Odd Noodle Games is
            the data controller for any personal data processed in connection with this website.
          </p>
        </Section>

        {/* Section 2 */}
        <Section title="2. Information We Collect">
          <p style={p}>
            Our web server (Caddy) records standard access logs as a normal part of operating the
            service. Each log entry may include: IP address, requested URL, timestamp, HTTP method,
            response status code, browser user agent, and referrer. We use these logs to maintain
            security, troubleshoot problems, and generate basic aggregate traffic statistics using a
            self-hosted analytics tool (GoAccess). No third-party analytics services receive this
            data.
          </p>
          <p style={p}>
            We do not use server logs to identify individual users, build profiles, or serve
            advertising. Our lawful basis for this processing is our{' '}
            <strong style={{ color: '#d4c8f0' }}>legitimate interests</strong> (GDPR Art. 6(1)(f))
            in operating, securing, and improving the service. We do not use analytics cookies for
            this server-side analytics.
          </p>
        </Section>

        {/* Section 3 */}
        <Section title="3. Cookies and Local Storage">
          <p style={p}>
            We do not set any cookies. We do not use advertising tracking pixels or fingerprinting
            of any kind.
          </p>
          <p style={p}>
            Some games may use your browser's temporary in-session memory (sessionStorage) to store
            game state such as your current score or progress. This data never leaves your browser,
            is never transmitted to any server, and is cleared automatically when you close the tab
            or browser window.
          </p>
        </Section>

        {/* Section 4 */}
        <Section title="4. Google Fonts (Third-Party Disclosure)">
          <p style={p}>
            When you visit a page on oddnoodlegames.com, your browser loads fonts from{' '}
            <strong style={{ color: '#d4c8f0' }}>fonts.googleapis.com</strong> and{' '}
            <strong style={{ color: '#d4c8f0' }}>fonts.gstatic.com</strong> — servers operated by
            Google LLC. This is the only external request made by the site.
          </p>
          <p style={p}>
            This request includes your browser's IP address, which is personal data under the GDPR.
            We rely on <strong style={{ color: '#d4c8f0' }}>legitimate interest</strong> (GDPR Art.
            6(1)(f)) as the lawful basis for this processing — specifically, delivering readable
            fonts to display the site correctly. This request is a standard practice used by
            millions of websites.
          </p>
          <p style={p}>
            We have no control over how Google processes this data. Google LLC processes it under
            their own privacy policy and, for EEA users, under Google's Standard Contractual
            Clauses. You can review Google's privacy practices at{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#ffe066' }}
            >
              policies.google.com/privacy
            </a>.
          </p>
          <p style={p}>
            Other than Google Fonts, no personal data is transferred to any third country or
            international organisation.
          </p>
        </Section>

        {/* Section 5 */}
        <Section title="5. Children's Privacy — COPPA & GDPR">
          <p style={p}>
            Odd Noodle Games is directed at children, and we take children's privacy seriously.
          </p>
          <p style={p}>
            <strong style={{ color: '#d4c8f0' }}>United States (COPPA):</strong> We comply with
            the Children's Online Privacy Protection Act. We do not knowingly collect personal
            information from children under 13 beyond the standard server logs described in Section
            2, which are not used to identify or contact individuals. We do not require children to
            disclose any personal information to use any game on this site. There are no accounts,
            no chat features, and no user-generated content transmitted to any server. If you
            believe a child has accidentally provided personal information to us, please contact us
            at{' '}
            <a href="mailto:privacy@oddnoodlegames.com" style={{ color: '#ffe066' }}>
              privacy@oddnoodlegames.com
            </a>{' '}
            and we will promptly address the concern.
          </p>
          <p style={p}>
            <strong style={{ color: '#d4c8f0' }}>European Economic Area (GDPR Art. 8 / GDPR-K):</strong>{' '}
            The GDPR requires parental consent before processing personal data of children under 16
            (or under 13 in some member states). Because we do not intentionally collect personal
            data from children, and any server log data is used only for the aggregate operational
            purposes described in Section 2, parental consent is not required for use of this site.
            The only other incidental data exposure is the Google Fonts IP address described in
            Section 4, which is not data we control or retain.
          </p>
        </Section>

        {/* Section 6 */}
        <Section title="6. Your Rights Under GDPR">
          <p style={p}>
            If you are in the EEA, UK, or Switzerland, you have rights under the GDPR including the
            right to access, rectify, erase, restrict, and port your personal data, and to object
            to processing.
          </p>
          <p style={p}>
            Server logs described in Section 2 may contain your IP address. If you wish to exercise
            your rights in relation to this data (access, erasure, objection, etc.), please contact
            us at{' '}
            <a href="mailto:privacy@oddnoodlegames.com" style={{ color: '#ffe066' }}>
              privacy@oddnoodlegames.com
            </a>. In practice, individual log entries are difficult to isolate by identity, but we
            will make reasonable efforts to locate and delete entries associated with a specific IP
            address upon request. For concerns about the Google Fonts data described in Section 4,
            those rights can be exercised directly through Google's privacy controls at{' '}
            <a
              href="https://myaccount.google.com/data-and-privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#ffe066' }}
            >
              myaccount.google.com/data-and-privacy
            </a>.
          </p>
          <p style={p}>
            You also have the right to lodge a complaint with your local data protection supervisory
            authority.
          </p>
        </Section>

        {/* Section 7 */}
        <Section title="7. Data Retention">
          <p style={p}>
            Raw server logs are retained for 90 days and then deleted. Aggregate traffic statistics
            generated from those logs contain no individual user data and may be kept for longer.
            Temporary in-browser game state is held only in your browser's memory and is never
            transmitted to us.
          </p>
        </Section>

        {/* Section 8 */}
        <Section title="8. Third-Party Links">
          <p style={p}>
            Games on this site may contain links to external websites. Those sites have their own
            privacy policies, and we are not responsible for their content or practices. We
            recommend reviewing the privacy policy of any external site you visit.
          </p>
        </Section>

        {/* Section 9 */}
        <Section title="9. Changes to This Policy">
          <p style={p}>
            If we update this policy, we will change the "Last updated" date at the top of this
            page. We will only change the date when the policy content actually changes, not on
            every site deployment.
          </p>
          <p style={p}>
            Continued use of the site after a change to this policy constitutes acceptance of the
            updated terms.
          </p>
        </Section>

        {/* Section 10 */}
        <Section title="10. Contact Us">
          <p style={p}>
            For any privacy-related questions or concerns, please contact us at{' '}
            <a href="mailto:privacy@oddnoodlegames.com" style={{ color: '#ffe066' }}>
              privacy@oddnoodlegames.com
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

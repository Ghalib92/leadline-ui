import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { generateSEOTags } from '~/lib/utils/seo';

export const CONTACT_EMAIL = 'info@digitalappex.co.ke';
export const UPDATED = '20 November 2026';

export function meta() {
  return generateSEOTags({
    title: 'Privacy | Leadline',
    description:
      'What Leadline collects, why, how long we keep it, and how to see, fix or delete your data.',
    url: '/privacy',
    keywords: 'Leadline privacy, data protection, Kenya Data Protection Act',
  });
}

function Section({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  const mail = (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      {CONTACT_EMAIL}
    </a>
  );
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <p className="text-sm font-semibold text-primary">Privacy</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">
        Your data, in plain words
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated {UPDATED}
      </p>

      <div className="mt-10 space-y-10 leading-relaxed text-muted-foreground">
        <Section title="Who we are">
          <p>
            Leadline is run by Digital Appex Limited, in Nairobi, Kenya. We
            decide what happens to the data you give Leadline, and we answer for
            it under Kenya’s Data Protection Act, 2019. Questions or requests:{' '}
            {mail}.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-foreground">Your account:</span>{' '}
              your name, email address and password. The password is stored
              scrambled; nobody can read it, including us.
            </li>
            <li>
              <span className="font-medium text-foreground">
                What you tell Leadline:
              </span>{' '}
              your organization’s profile, what you sell or look for, your
              preferences, and the documents you upload, such as company
              profiles, certificates, past proposals and CVs.
            </li>
            <li>
              <span className="font-medium text-foreground">
                What you do in it:
              </span>{' '}
              what you approve or reject and why, your notes, call logs and
              drafts.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Technical data:
              </span>{' '}
              your IP address and basic request details, which our server logs
              to keep Leadline secure and to limit abuse, such as repeated
              sign-in attempts.
            </li>
          </ul>
        </Section>

        <Section title="Why we use it">
          <p>
            Only to run Leadline for you: to find opportunities that fit you,
            score them, write summaries, pitches, bids and applications, send
            you sign-in codes and reminders, and keep the service secure. We
            don’t sell your data, we don’t show ads, and we don’t use it to
            train AI models.
          </p>
          <p>
            Leadline never sends an email, contacts anyone or submits anything
            for you without your approval.
          </p>
        </Section>

        <Section title="Who else handles it">
          <p>
            A few trusted service providers help us run Leadline, for example to
            host it, send emails and run the AI that reads and writes for you.
            They may use your data only to do that work for us. Some of them are
            outside Kenya. We never send your documents, CVs or drafts to a
            service that uses them to train its AI.
          </p>
        </Section>

        <Section title="Cookies and storage in your browser">
          <p>
            One cookie keeps you signed in. Scripts on the page can’t read it.
            Your browser also remembers the last organization you opened and
            whether you have seen the tour. We use no advertising or tracking
            cookies.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            For as long as you have an account. When you delete a document, it
            is removed from our server. Backups are kept for 14 days, then
            deleted. Server logs are kept only briefly, then overwritten.
          </p>
        </Section>

        <Section title="How we protect it">
          <p>
            Everything travels encrypted (HTTPS). Passwords are stored
            scrambled, only a few people can reach the server, and each
            organization sees only its own data.
          </p>
        </Section>

        <Section title="Your rights">
          <p>Under Kenya’s Data Protection Act, you can ask us to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>show you the data we hold about you, and give you a copy</li>
            <li>correct data that is wrong</li>
            <li>delete your data or your account</li>
            <li>stop using your data for a purpose you object to</li>
          </ul>
          <p>
            Write to {mail}. We will answer within 30 days. If you’re not happy
            with our answer, you can complain to the{' '}
            <a
              href="https://www.odpc.go.ke"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Office of the Data Protection Commissioner
            </a>
            .
          </p>
        </Section>

        <Section title="Children">
          <p>Leadline is for adults. Don’t use it if you are under 18.</p>
        </Section>

        <Section title="Changes">
          <p>
            If we change how we use your data, we will update this page and its
            date, and tell you by email when the change matters to you.
          </p>
        </Section>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        <Link to="/" className="text-primary hover:underline">
          Back to Leadline
        </Link>
      </p>
    </div>
  );
}

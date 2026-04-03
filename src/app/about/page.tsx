import { PageMasthead, SectionLead, SignatureCTA, SurfaceArtwork } from "@/components/sections";
import { aboutPrinciples } from "@/lib/site-data";

export default function AboutPage() {
  return (
    <main>
      <PageMasthead
        label="About"
        title="A better standard of restoration and finish-focused service."
        body="The LIVANE story is intentionally held in a premium framework that feels serious, thoughtful, and trustworthy without inventing history or relying on small-business cliches."
        caption="Room for a future founder story, company narrative, and project-led brand proof."
      />

      <section className="shell about-opening">
        <div className="about-opening-copy">
          <SectionLead
            label="Opening Statement"
            title="Quality should feel visible, organized, and fully considered."
            body="LIVANE is presented for clients who value finish quality, calmer presentation, and dependable execution. The work is positioned as disciplined improvement for spaces that need to look sharper, cleaner, and more complete."
          />
        </div>
        <SurfaceArtwork variant="monolith" caption="Brand atmosphere connected to material transformation" />
      </section>

      <section className="shell about-principles">
        {aboutPrinciples.map((item) => (
          <article key={item.title} className="about-principle">
            <p className="section-label">Principle</p>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="shell about-framework">
        <div className="about-framework-block">
          <p className="section-label">Who We Are</p>
          <h2 className="section-title">A premium framework for the real story.</h2>
          <p className="section-body">
            This section is intentionally written as refined placeholder copy so
            LIVANE&apos;s actual background, founder perspective, and company story
            can be added later without rebuilding the design language.
          </p>
        </div>
        <div className="about-framework-block">
          <p className="section-label">Why Clients Trust Us</p>
          <p className="section-body">
            Trust is shaped through recommendation quality, responsiveness,
            scheduling discipline, and the sense that the work is being handled
            with more care than the average local service brand usually communicates.
          </p>
          <p className="section-body">
            The result should feel grounded and human, while still carrying the
            visual confidence of a premium brand.
          </p>
        </div>
      </section>

      <SignatureCTA
        title="Start with the space, then define the right scope."
        body="If you want a measured recommendation instead of a rushed quote, LIVANE can review the condition and help shape the right next step."
        primaryHref="/contact"
        primaryLabel="Request a Free Site Visit"
        secondaryHref="/projects"
        secondaryLabel="View Projects"
      />
    </main>
  );
}

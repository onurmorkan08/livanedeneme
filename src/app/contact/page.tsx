import { ContactForm, PageMasthead, SectionLead, SurfaceArtwork } from "@/components/sections";

export default function ContactPage() {
  return (
    <main>
      <PageMasthead
        label="Contact"
        title="Tell us about the space, the surface, or the project."
        body="Share photos if available, or request a free site visit so we can review the condition and recommend the right scope."
        caption="Minimal, premium, and frictionless."
      />

      <section className="shell contact-layout">
        <div className="contact-side">
          <SurfaceArtwork variant="monolith" caption="Atmospheric visual content integrated into the contact experience" />
          <div className="contact-details">
            <SectionLead
              label="Reach LIVANE"
              title="Start the conversation cleanly."
              body="Request a free site visit or begin with photos and a brief description. LIVANE serves the Miami & Fort Lauderdale area."
            />
            <div className="contact-links">
              <a href="mailto:hello@livane.com">hello@livane.com</a>
              <a href="tel:3055550148">(305) 555-0148</a>
            </div>
          </div>
        </div>

        <ContactForm />
      </section>
    </main>
  );
}

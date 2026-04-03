import Link from "next/link";
import { ReactNode } from "react";

type IntroProps = {
  label: string;
  title: string;
  body?: string;
  align?: "left" | "center";
};

export function SectionLead({
  label,
  title,
  body,
  align = "left",
}: IntroProps) {
  return (
    <div className={align === "center" ? "section-lead center" : "section-lead"}>
      <p className="section-label">{label}</p>
      <h2 className="section-title">{title}</h2>
      {body ? <p className="section-body">{body}</p> : null}
    </div>
  );
}

export function PageMasthead({
  label,
  title,
  body,
  caption,
}: {
  label: string;
  title: string;
  body: string;
  caption?: string;
}) {
  return (
    <section className="page-masthead shell">
      <div className="page-masthead-grid">
        <div>
          <p className="section-label">{label}</p>
          <h1 className="page-title">{title}</h1>
        </div>
        <div className="page-masthead-side">
          <p className="page-body">{body}</p>
          {caption ? <p className="page-caption">{caption}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function SurfaceArtwork({
  variant = "hero",
  caption,
}: {
  variant?: "hero" | "monolith" | "slab" | "project";
  caption?: string;
}) {
  return (
    <div className={`surface-artwork ${variant}`}>
      <div className="surface-aura" />
      <div className="surface-pane surface-pane-one" />
      <div className="surface-pane surface-pane-two" />
      <div className="surface-pane surface-pane-three" />
      <div className="surface-linework" />
      {caption ? <p className="surface-caption">{caption}</p> : null}
    </div>
  );
}

export function ServiceEditorial({
  index,
  title,
  body,
  items,
}: {
  index: string;
  title: string;
  body: string;
  items: string[];
}) {
  return (
    <article className="service-editorial">
      <div className="service-editorial-meta">
        <span>{index}</span>
      </div>
      <div className="service-editorial-copy">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <div className="service-editorial-list">
        {items.slice(0, 6).map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </article>
  );
}

export function ProjectPanel({
  category,
  title,
  summary,
  tone = "left",
}: {
  category: string;
  title: string;
  summary: string;
  tone?: "left" | "right";
}) {
  return (
    <article className={`project-panel ${tone}`}>
      <div className="project-panel-art">
        <SurfaceArtwork variant="project" caption="Future real project photography" />
      </div>
      <div className="project-panel-copy">
        <p className="section-label">{category}</p>
        <h3>{title}</h3>
        <p>{summary}</p>
      </div>
    </article>
  );
}

export function CityRibbon({ cities }: { cities: string[] }) {
  return (
    <div className="city-ribbon">
      {cities.map((city) => (
        <span key={city}>{city}</span>
      ))}
    </div>
  );
}

export function SignatureCTA({
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="shell cta-block">
      <div className="cta-plate">
        <SurfaceArtwork variant="slab" />
        <div className="cta-copy">
          <p className="section-label">Next step</p>
          <h2 className="section-title">{title}</h2>
          <p className="section-body">{body}</p>
          <div className="cta-actions">
            <Link href={primaryHref} className="button-primary">
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link href={secondaryHref} className="button-quiet">
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactForm() {
  return (
    <form className="contact-form" action="#">
      <div className="contact-grid">
        <label>
          <span>Name</span>
          <input className="field-input" type="text" name="name" placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input className="field-input" type="email" name="email" placeholder="name@example.com" />
        </label>
        <label>
          <span>Phone</span>
          <input className="field-input" type="tel" name="phone" placeholder="(305) 555-0148" />
        </label>
        <label>
          <span>Project Type</span>
          <select className="field-input" name="projectType" defaultValue="">
            <option value="" disabled>
              Select a service group
            </option>
            <option>Floor Restoration</option>
            <option>Renovation & Finish Services</option>
            <option>Exterior Surfaces</option>
            <option>Project Support</option>
          </select>
        </label>
      </div>

      <label>
        <span>Location</span>
        <input className="field-input" type="text" name="location" placeholder="Miami, Fort Lauderdale, or nearby city" />
      </label>

      <label>
        <span>Message</span>
        <textarea
          className="field-input textarea"
          name="message"
          placeholder="Tell us about the space, the surface, or the project. Share photos if available and note any finish goals or timing."
        />
      </label>

      <p className="contact-note">
        You can share photos or a brief description to help us understand the scope.
      </p>
      <button type="submit" className="button-primary">
        Request a Free Site Visit
      </button>
    </form>
  );
}

export function SplitStatement({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <section className="shell split-statement">
      <div>{left}</div>
      <div>{right}</div>
    </section>
  );
}

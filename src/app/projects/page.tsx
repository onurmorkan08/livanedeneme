import {
  PageMasthead,
  ProjectPanel,
  SectionLead,
  SignatureCTA,
  SurfaceArtwork,
} from "@/components/sections";
import { featuredProjects, projectCategories } from "@/lib/site-data";

const supportingProjects = [
  {
    title: "Bayfront Lobby Surface Renewal",
    category: "Floor restoration",
    summary:
      "Polishing and corrective work planned to improve consistency, finish clarity, and the visual arrival of the space.",
  },
  {
    title: "Interior Finish Coordination Scope",
    category: "Multi-scope work",
    summary:
      "Several smaller packages aligned into one cleaner overall result with better sequencing and stronger presentation.",
  },
  {
    title: "Pool Deck Cleaning & Sealing",
    category: "Exterior surfaces",
    summary:
      "Exterior care focused on restoring surface tone, reducing visible wear, and improving day-to-day appearance.",
  },
];

export default function ProjectsPage() {
  return (
    <main>
      <PageMasthead
        label="Projects"
        title="Selected work designed to feel curated, not catalogued."
        body="This page is built to hold real photography, case-style summaries, and future before-and-after storytelling without dropping into a generic local portfolio style."
        caption={projectCategories.join(" / ")}
      />

      <section className="shell projects-intro-slab">
        <SectionLead
          label="Presentation"
          title="Proof should feel composed."
          body="Selected work is framed with more space, stronger image treatment, and a calmer editorial rhythm."
        />
        <SurfaceArtwork variant="slab" caption="Curated visual frame for future project imagery" />
      </section>

      <section className="shell project-panel-stack">
        {featuredProjects.map((project, index) => (
          <ProjectPanel
            key={project.title}
            category={project.category}
            title={project.title}
            summary={project.summary}
            tone={index % 2 === 0 ? "left" : "right"}
          />
        ))}
      </section>

      <section className="shell supporting-projects">
        <div className="supporting-projects-grid">
          {supportingProjects.map((project) => (
            <article key={project.title} className="supporting-project-card">
              <p className="section-label">{project.category}</p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <SignatureCTA
        title="Show us the space and we’ll review the right path."
        body="If you already have photos, a scope list, or visible surface issues, LIVANE can help clarify what the project actually needs."
        primaryHref="/contact"
        primaryLabel="Request a Free Site Visit"
        secondaryHref="/services"
        secondaryLabel="Explore Services"
      />
    </main>
  );
}

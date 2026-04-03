import {
  PageMasthead,
  SectionLead,
  ServiceEditorial,
  SignatureCTA,
  SurfaceArtwork,
} from "@/components/sections";
import { serviceGroups } from "@/lib/site-data";

export default function ServicesPage() {
  return (
    <main>
      <PageMasthead
        label="Services"
        title="Interior and exterior improvement with more finish awareness."
        body="LIVANE supports restoration, renovation, exterior care, and project support through a structure that feels composed, premium, and easy to understand."
        caption="A service page can still feel editorial when hierarchy leads the experience."
      />

      <section className="shell service-page-intro">
        <div className="service-page-art">
          <SurfaceArtwork variant="monolith" caption="Generated visual atmosphere tied to material refinement" />
        </div>
        <SectionLead
          label="Approach"
          title="Organized with clarity, not clutter."
          body="Each service group is presented as a defined territory with room for future photography, deeper proof, and more detailed scope pages."
        />
      </section>

      <section className="shell service-editorial-stack">
        {serviceGroups.map((group, index) => (
          <ServiceEditorial
            key={group.title}
            index={`0${index + 1}`}
            title={group.title}
            body={group.intro}
            items={group.items}
          />
        ))}
      </section>

      <SignatureCTA
        title="Discuss the project with the right level of context."
        body="If the scope is still taking shape, LIVANE can review the condition, priorities, and finish expectations before recommendations are finalized."
        primaryHref="/contact"
        primaryLabel="Request a Free Site Visit"
        secondaryHref="/contact"
        secondaryLabel="Discuss Your Project"
      />
    </main>
  );
}

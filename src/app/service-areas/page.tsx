import { CityRibbon, PageMasthead, SectionLead, SignatureCTA, SurfaceArtwork } from "@/components/sections";
import { serviceAreaCities } from "@/lib/site-data";

export default function ServiceAreasPage() {
  return (
    <main>
      <PageMasthead
        label="Service Areas"
        title="Serving the Miami & Fort Lauderdale Area"
        body="LIVANE provides restoration, renovation, and surface improvement services across the Miami and Fort Lauderdale area for clients who need spaces to look cleaner, sharper, more refined, and properly finished."
        caption="Premium local coverage without keyword-stuffed clutter."
      />

      <section className="shell area-page-intro">
        <SectionLead
          label="Local Presence"
          title="A controlled local page with taste."
          body="The purpose here is simple: show where LIVANE works, communicate the service territory clearly, and preserve the same premium tone as the rest of the site."
        />
        <SurfaceArtwork variant="slab" caption="South Florida coverage presented through the same material-led visual world" />
      </section>

      <section className="shell area-page-cities">
        <CityRibbon cities={serviceAreaCities} />
      </section>

      <section className="shell area-page-note">
        <div className="area-note-block">
          <p className="section-body">
            Coverage can expand later into more detailed local pages if needed,
            but the current approach keeps the experience polished, restrained, and
            aligned with the brand.
          </p>
        </div>
      </section>

      <SignatureCTA
        title="Request a site visit in your area."
        body="Share your city, project details, and any photos you have available so LIVANE can review the space properly."
        primaryHref="/contact"
        primaryLabel="Request a Free Site Visit"
        secondaryHref="/contact"
        secondaryLabel="Contact LIVANE"
      />
    </main>
  );
}

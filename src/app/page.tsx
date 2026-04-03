import Link from "next/link";

import {
  featuredProjects,
  processSteps,
  serviceAreaCities,
  serviceGroups,
  whyLivane,
} from "@/lib/site-data";

export default function Home() {
  return (
    <main className="monograph-home v2">
      <section className="shell hero-stage-v2">
        <div className="hero-stage-topline">
          <span>Miami & Fort Lauderdale Area</span>
          <span>LIVANE</span>
        </div>

        <div className="hero-stage-frame">
          <div className="hero-stage-column hero-stage-column-left">
            <p className="hero-kicker-v2">Premium restoration, renovation, and surface improvement</p>
            <h1 className="hero-title-v2">
              Spaces
              <br />
              restored.
              <br />
              Surfaces
              <br />
              elevated.
            </h1>
          </div>

          <div className="hero-stage-column hero-stage-column-right">
            <div className="hero-note-v2">
              <p>
                A homepage built like an editorial composition: light, surface,
                reflection, and finish quality before service-template logic.
              </p>
            </div>

            <div className="hero-art-v2" aria-hidden="true">
              <div className="hero-art-sun" />
              <div className="hero-art-panel hero-art-panel-a" />
              <div className="hero-art-panel hero-art-panel-b" />
              <div className="hero-art-panel hero-art-panel-c" />
              <div className="hero-art-slice" />
              <div className="hero-art-shadow" />
            </div>
          </div>
        </div>

        <div className="hero-stage-footer">
          <div className="hero-summary-v2">
            <p>
              Premium restoration, renovation, and surface improvement for spaces
              that need to look exceptional.
            </p>
          </div>

          <div className="hero-actions-v2">
            <Link href="/contact" className="button-primary">
              Request a Free Site Visit
            </Link>
            <Link href="/projects" className="button-quiet">
              View Projects
            </Link>
          </div>
        </div>
      </section>

      <section className="shell manifesto-stage-v2">
        <div className="manifesto-rail-v2">
          <p className="manifesto-label-v2">Monograph Light</p>
          <span />
        </div>

        <div className="manifesto-main-v2">
          <div className="manifesto-heading-v2">
            <p className="section-label light">Positioning</p>
            <h2 className="statement-v2">
              LIVANE should feel like the team that improves how a space reads,
              not just the team that completes a task.
            </h2>
          </div>

          <div className="manifesto-columns-v2">
            <p>
              Floor restoration, polishing, renovation services, exterior surface
              care, and project support are presented here as part of one
              finish-driven practice.
            </p>
            <p>
              The visual story is about clarity, discipline, and material
              transformation. The layout is intentionally spare so the brand can
              feel more architectural than operational.
            </p>
          </div>
        </div>
      </section>

      <section className="shell tableau-stage-v2">
        <div className="tableau-intro-v2">
          <p className="section-label light">Capabilities</p>
          <h2 className="tableau-title-v2">A service presentation with hierarchy, pause, and scale.</h2>
        </div>

        <div className="tableau-grid-v2">
          {serviceGroups.map((group, index) => (
            <article
              key={group.title}
              className={`tableau-item-v2 tableau-item-v2-${index + 1}`}
            >
              <div className="tableau-number-v2">{`0${index + 1}`}</div>
              <div className="tableau-copy-v2">
                <h3>{group.title}</h3>
                <p>{group.intro}</p>
              </div>
              <div className="tableau-tags-v2">
                {group.items.slice(0, 4).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell corridor-stage-v2">
        <div className="corridor-heading-v2">
          <p className="section-label light">Selected Work</p>
          <h2 className="corridor-title-v2">Evidence, presented with more restraint.</h2>
        </div>

        <div className="corridor-strip-v2">
          {featuredProjects.map((project, index) => (
            <article
              key={project.title}
              className={`corridor-panel-v2 corridor-panel-v2-${index + 1}`}
            >
              <div className="corridor-art-v2" aria-hidden="true">
                <div className="corridor-art-core" />
              </div>
              <div className="corridor-copy-v2">
                <p className="project-category">{project.category}</p>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell standards-stage-v2">
        <div className="standards-stage-left">
          <p className="section-label light">Standard</p>
          <h2 className="standards-title-v2">Trust comes from control, not decoration.</h2>
          <div className="standards-list-v2">
            {whyLivane.map((item) => (
              <div key={item} className="standards-line-v2">
                <span />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="standards-stage-right">
          <div className="process-card-v2">
            <p className="section-label light">Process</p>
            <div className="process-steps-v2">
              {processSteps.map((step, index) => (
                <div key={step} className="process-line-v2">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="area-card-v2">
            <p className="section-label light">Territory</p>
            <div className="area-ribbon-v2">
              {serviceAreaCities.slice(0, 8).map((city) => (
                <span key={city}>{city}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell close-stage-v2">
        <div className="close-stage-art-v2" aria-hidden="true">
          <div className="close-art-orb-v2" />
          <div className="close-art-plane-v2" />
        </div>

        <div className="close-stage-copy-v2">
          <p className="section-label light">Next Step</p>
          <h2 className="close-title-v2">Request a free site visit.</h2>
          <p>
            Tell LIVANE what needs to be restored, refined, repaired, or
            prepared. We&apos;ll review the space and recommend the right scope.
          </p>

          <div className="hero-actions-v2">
            <Link href="/contact" className="button-primary">
              Request a Free Site Visit
            </Link>
            <Link href="/projects" className="button-quiet">
              View Projects
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

# Content creation, music, and campus experience

The My Life section follows About Me and displays its three narrative paragraphs 24px below the MY LIFE heading. Its chapter header mirrors Introduction with `04 / MY LIFE`, the small `CONTENT / MUSIC / COLLABORATION` eyebrow, and a desktop `ON STAGE & BEHIND THE SCENES` caption. The vinyl record is anchored flush to the section's top and right edges directly beneath the red divider. On desktop, the heading and copy share the left column, with 64px top padding, 128px bottom padding, and a minimum viewport height. On phones, the copy spans the section beneath the heading and record, with 48px top padding and 88px bottom padding. Maintain the narrative in `src/content.ts` under `myLife`; markup is in `src/App.tsx` and styling is in `src/styles.css`. Creative project cards and the campus timeline follow this section. Their content is maintained under `creativeProjects` and `campusAndMusic`, with markup in `src/CreativeProjects.tsx` and styling in `src/CreativeProjects.css`. The narrative is not repeated in those project and timeline sections.

## Content sources and confirmation

Two matching full-width red lines separate the Explore navigation cards from About Me and About Me from My Life. Their markup is in `src/App.tsx`; the shared `.section-divider` rule in `src/styles.css` uses the site's red accent and a 2px height. The lines are decorative, static, and hidden from assistive technology. The previous music ribbon and its animation have been removed. Previews are saved to `artifacts/section-divider-{width}.png` and `artifacts/explore-about-divider-{width}.png` by the existing About Me responsive test.

The owner supplied the descriptions and timeline for this module. Account and work links were taken from `docs/information/personal-information.md`. Only the information requested for this module was incorporated.

On 18 October 2026, the owner confirmed “至今” (through the present) in response to the question about ongoing account activity and the statistics cutoff. The page therefore uses `2023–Present` and labels the combined 1,000+ followers and 500K+ video views as of 18 October 2026. These are owner-reported figures; they are not fetched or automatically refreshed. Update the values and both date fields together when new figures are supplied.

The owner has no selected-video links yet. The module omits that action until a specific link is provided. Both account links and the MV link are active. Project notes expand inline using native HTML `details`; the supplied song link is available inside the expanded notes. The page makes no third-party media requests and adds no autoplay or embedded players.

The work is 《星火 Fiery Stars》, the University of Nottingham Ningbo China’s 20th anniversary theme song and MV (2024). The English page uses the supplied English title, **Fiery Stars**. The decorative waveform and star artwork do not depict an audio recording or a project photograph.

## Campus timeline

- 2021–2023: Organization Department, Faculty of Humanities and Social Sciences Youth League branch; campus event planning and delivery.
- 2022–2023: Notting VOICE campus singing competition runner-up.
- 2022–2025: UNNC Choir tenor and campus music performances, including the spring symphony concert and the University of Nottingham Malaysia’s 25th anniversary celebration.
- 2023–2025: Competition organization, mentoring, stage lighting, and artistic direction.

The section retains the requested `07 / CAMPUS & MUSIC` label and uses `#campus-and-music` for its page link. The two earlier experience sections remain separate navigation destinations.

## Verification

Run `npm run build` for TypeScript and Vue checks plus a production build. Run `npx playwright test tests/creative-projects.spec.ts` after building for the module’s responsive, keyboard, anchor, and dark-surface checks. The existing Playwright configuration starts its own production preview on port 5199. Screenshots are written to `artifacts/creative-projects-{width}.png` at 320, 390, 768, and 1440px. `npm run test:e2e` builds and runs the full existing regression suite.

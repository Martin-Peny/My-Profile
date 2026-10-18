import { academicNotebook } from "./content";
import { useLanguage } from "./i18n";

export function AcademicPages({ spread }: { spread: number }) {
  const { t } = useLanguage();
  const { education, skills, interests, projects, experience } = academicNotebook;
  const entries = (items: typeof projects) => items.map(item => (
    <section className="academic-resume-entry" key={item.title}>
      <h4>{t(item.title)}</h4>
      <p className="academic-resume-role">{t(item.role)}</p>
      <p className="academic-resume-meta"><span>{t(item.period)}</span><span>{t(item.location)}</span></p>
      <ul>{item.bullets.map(bullet => <li key={bullet}>{t(bullet)}</li>)}</ul>
    </section>
  ));

  return (
    <div className="academic-content-grid" key={spread} data-spread={spread + 1}>
      <article className="academic-reader-page" aria-labelledby="academic-left-title">
        <p className="micro academic-content-label">{t(spread === 0 ? "01 / BACKGROUND" : "03 / RESEARCH")}</p>
        <h3 id="academic-left-title">{t(spread === 0 ? "Education" : "Research Projects")}</h3>
        {spread === 0 ? <>
          <section className="academic-education">
            <h4>{t(education.university)}</h4>
            <p className="academic-degree">{t(education.degree)}</p>
            <p className="academic-resume-meta">{t(education.period)}</p>
            <p>{t(education.courses)}</p>
          </section>
          <h3 className="academic-skills-title">{t("Skills")}</h3>
          <dl className="academic-skills">{skills.map(skill => <div key={skill.title}>
            <dt>{t(skill.title)}</dt><dd>{t(skill.description)}
              {skill.note && <span className="academic-pending">{t(skill.note)}</span>}
            </dd>
          </div>)}</dl>
        </> : entries(projects)}
        <span className="academic-page-number micro">{spread === 0 ? "01" : "03"}</span>
      </article>
      <article className="academic-reader-page" aria-labelledby="academic-right-title">
        <p className="micro academic-content-label">{t(spread === 0 ? "02 / EXPLORATION" : "04 / PRACTICE")}</p>
        <h3 id="academic-right-title">{t(spread === 0 ? "Research Interests" : "Professional Experience")}</h3>
        {spread === 0 ? <ol className="academic-question-list">{interests.map((interest, index) => <li key={interest.title}>
          <span className="micro">0{index + 1}</span><div><h4>{t(interest.title)}</h4><p>{t(interest.description)}</p></div>
        </li>)}</ol> : entries(experience)}
        <span className="academic-page-number micro">{spread === 0 ? "02" : "04"}</span>
      </article>
    </div>
  );
}

import type { ReactNode } from "react";
import { createRequire } from "node:module";
import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { skillLevels, type CV, type SkillLevel } from "@/lib/cv";
import { range } from "@/lib/format";

/* ── Fonts ────────────────────────────────────────────────────────────────
   Same families as the website, loaded from the static fontsource files so
   react-pdf can embed them (it reads WOFF, not variable WOFF2). */
const require = createRequire(import.meta.url);
const font = (file: string) => require.resolve(file);

Font.register({
  family: "Inter",
  fonts: [
    { src: font("@fontsource/inter/files/inter-latin-400-normal.woff"), fontWeight: 400 },
    { src: font("@fontsource/inter/files/inter-latin-400-italic.woff"), fontWeight: 400, fontStyle: "italic" },
    { src: font("@fontsource/inter/files/inter-latin-500-normal.woff"), fontWeight: 500 },
    { src: font("@fontsource/inter/files/inter-latin-600-normal.woff"), fontWeight: 600 },
    { src: font("@fontsource/inter/files/inter-latin-700-normal.woff"), fontWeight: 700 },
  ],
});
Font.register({
  family: "Instrument Serif",
  fonts: [
    { src: font("@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff") },
    { src: font("@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff"), fontStyle: "italic" },
  ],
});
// Never break words with hyphens: it looks sloppy in a CV.
Font.registerHyphenationCallback((word) => [word]);

/* ── Design tokens (print-friendly take on the website palette) ─────────── */
const c = {
  ink: "#0a0b0f",
  text: "#24262d",
  mute: "#6b6f7b",
  line: "#e3e1da",
  side: "#f6f4ee",
  accent: "#d4ff5a",
  accentInk: "#4d5f12",
};

const s = StyleSheet.create({
  // Text styles live on `base`, not on the Page: inherited Page text styles make
  // react-pdf silently drop the dynamic page numbers in the footer.
  base: { fontFamily: "Inter", fontSize: 8.6, lineHeight: 1.42, color: c.text },
  page: { paddingTop: 34, paddingBottom: 44 },
  // Sidebar background spans every page.
  sideBg: { position: "absolute", top: 0, bottom: 0, left: 0, width: 190, backgroundColor: c.side },

  header: { flexDirection: "row", paddingTop: 4, paddingBottom: 20 },
  headerSide: { width: 190, paddingHorizontal: 26, justifyContent: "flex-end" },
  headerMain: { flex: 1, paddingLeft: 26, paddingRight: 40 },
  monogram: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: c.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  monogramText: { fontFamily: "Instrument Serif", fontSize: 21, color: c.accent, marginTop: 3 },
  name: { fontFamily: "Instrument Serif", fontSize: 34, color: c.ink, lineHeight: 1 },
  nameAccent: { color: c.accentInk },
  headline: { fontSize: 11, fontWeight: 600, color: c.ink, marginTop: 6 },
  tagline: { fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 12.5, color: c.mute, marginTop: 5, lineHeight: 1.3 },

  body: { flexDirection: "row" },
  side: { width: 190, paddingHorizontal: 26 },
  main: { flex: 1, paddingLeft: 26, paddingRight: 40 },

  section: { marginBottom: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionMark: { width: 14, height: 4, backgroundColor: c.accent, marginRight: 7, borderRadius: 2 },
  sectionTitle: { fontSize: 7.5, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: c.ink },

  // Sidebar
  label: { fontSize: 6.8, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: c.mute, marginBottom: 1.5 },
  contactValue: { fontSize: 8.2, color: c.ink, marginBottom: 6, textDecoration: "none" },
  skillGroup: { marginBottom: 9 },
  skillGroupName: { fontSize: 8.2, fontWeight: 600, color: c.ink, marginBottom: 2 },
  legend: { flexDirection: "row", marginTop: -2, marginBottom: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 8, fontSize: 6.8, color: c.mute },
  legendSwatch: { width: 7, height: 7, borderRadius: 2, borderWidth: 0.5, borderColor: c.mute, marginRight: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 1 },
  chip: { fontSize: 7.6, color: c.ink, backgroundColor: "#ffffff", borderWidth: 0.5, borderColor: c.line, borderRadius: 3, paddingVertical: 1.5, paddingHorizontal: 4, marginRight: 3, marginBottom: 3, lineHeight: 1.2 },
  sideItem: { marginBottom: 8 },
  sideItemTitle: { fontSize: 8.4, fontWeight: 600, color: c.ink, lineHeight: 1.35 },
  sideItemMeta: { fontSize: 7.8, color: c.mute, marginTop: 1 },
  langRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3.5 },
  langName: { fontSize: 8.4, fontWeight: 600, color: c.ink },
  langLevel: { fontSize: 8, color: c.mute },

  // Main column
  profileStatement: { fontFamily: "Instrument Serif", fontSize: 13, color: c.ink, lineHeight: 1.3, marginBottom: 7 },
  paragraph: { marginBottom: 5 },

  company: { marginBottom: 9 },
  companyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 },
  companyName: { fontSize: 11, fontWeight: 700, color: c.ink },
  companyMeta: { fontSize: 7.8, color: c.mute },
  role: { marginTop: 4, paddingLeft: 9, borderLeftWidth: 1, borderLeftColor: c.line },
  roleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  roleTitle: { fontSize: 9.4, fontWeight: 600, color: c.ink },
  roleDates: { fontSize: 7.8, fontWeight: 500, color: c.mute },
  summary: { marginTop: 2.5 },
  bullets: { marginTop: 3 },
  bullet: { flexDirection: "row", marginBottom: 1.5 },
  bulletDot: { width: 9, color: c.accentInk, fontWeight: 700 },
  bulletText: { flex: 1 },
  tech: { marginTop: 3, fontSize: 7.6, color: c.mute },
  techLabel: { fontWeight: 600, color: c.text },

  project: { marginBottom: 6 },
  projectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  projectName: { fontSize: 9.4, fontWeight: 600, color: c.ink, textDecoration: "none" },
  projectMeta: { fontSize: 7.8, color: c.mute },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 216,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Inter",
    fontSize: 7,
    color: c.mute,
    borderTopWidth: 0.5,
    borderTopColor: c.line,
    paddingTop: 6,
  },
});

/* Skill levels: expert is filled, advanced outlined, familiar quiet. */
const chipLevel: Record<SkillLevel, Style> = {
  expert: { backgroundColor: c.ink, borderColor: c.ink, color: "#ffffff" },
  advanced: {},
  familiar: { backgroundColor: "transparent", color: c.mute },
};
const legendSwatch: Record<SkillLevel, Style> = {
  expert: { backgroundColor: c.ink, borderColor: c.ink },
  advanced: { backgroundColor: "#ffffff" },
  familiar: { backgroundColor: "transparent", borderColor: c.line },
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
const clean = (t: string) => t.replace(/\s+/g, " ").trim();
const bareUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Section({ title, children, wrap = true }: { title: string; children: ReactNode; wrap?: boolean }) {
  return (
    <View style={s.section} wrap={wrap}>
      {/* minPresenceAhead keeps a title from being stranded at the bottom of a page */}
      <View style={s.sectionTitleRow} minPresenceAhead={40}>
        <View style={s.sectionMark} />
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

type Role = CV["experience"]["items"][number];

/** Consecutive roles at the same company are shown as one employer with a career path. */
function groupByCompany(items: Role[]) {
  const groups: { company: string; location?: string | undefined; roles: Role[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.company === item.company) last.roles.push(item);
    else groups.push({ company: item.company, location: item.location, roles: [item] });
  }
  return groups;
}

/* ── Document ───────────────────────────────────────────────────────────── */
export default function CvDocument({ cv }: { cv: CV }) {
  const { person, about, experience, skills, projects, education } = cv;
  const fullName = `${person.firstName} ${person.lastName}`;
  const show = (id: CV["slides"][number]) => cv.slides.includes(id);
  const present = experience.presentLabel;

  return (
    <Document
      title={`${fullName} · Curriculum Vitae`}
      author={fullName}
      subject={person.headline}
      keywords={skills.groups.flatMap((g) => g.items.map((i) => i.name)).join(", ")}
      creator={cv.meta.url}
      producer={cv.meta.url}
      language={cv.meta.lang}
    >
      <Page size="A4" style={s.page}>
        <View style={s.sideBg} fixed />
        <View style={s.footer} fixed>
          <Text>
            {fullName} · Curriculum Vitae
          </Text>
          <Text>{bareUrl(cv.meta.url)}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

        {/* Header */}
        <View style={[s.base, s.header]}>
          <View style={s.headerSide}>
            <View style={s.monogram}>
              <Text style={s.monogramText}>
                {person.firstName[0]}
                {person.lastName[0]}
              </Text>
            </View>
          </View>
          <View style={s.headerMain}>
            <Text style={s.name}>
              {person.firstName} <Text style={s.nameAccent}>{person.lastName}</Text>
            </Text>
            <Text style={s.headline}>{person.headline}</Text>
            <Text style={s.tagline}>{clean(person.tagline)}</Text>
          </View>
        </View>

        <View style={[s.base, s.body]}>
          {/* Sidebar */}
          <View style={s.side}>
            <Section title="Contact">
              <Text style={s.label}>Email</Text>
              <Link src={`mailto:${person.email}`} style={s.contactValue}>
                {person.email}
              </Link>
              <Text style={s.label}>Location</Text>
              <Text style={s.contactValue}>{person.location}</Text>
              <Text style={s.label}>Website</Text>
              <Link src={cv.meta.url} style={s.contactValue}>
                {bareUrl(cv.meta.url)}
              </Link>
              {person.socials.map((social) => (
                <View key={social.url}>
                  <Text style={s.label}>{social.label}</Text>
                  <Link src={social.url} style={s.contactValue}>
                    {bareUrl(social.url)}
                  </Link>
                </View>
              ))}
            </Section>

            {show("skills") && (
              <Section title={skills.label}>
                {/* Legend for the chip styles, only for levels that are actually used. */}
                <View style={s.legend}>
                  {skillLevels
                    .filter((level) => skills.groups.some((g) => g.items.some((i) => i.level === level)))
                    .map((level) => (
                      <View key={level} style={s.legendItem}>
                        <View style={[s.legendSwatch, legendSwatch[level]]} />
                        <Text>{skills.levelLabels[level]}</Text>
                      </View>
                    ))}
                </View>
                {skills.groups.map((group) => (
                  <View key={group.name} style={s.skillGroup} wrap={false}>
                    <Text style={s.skillGroupName}>{group.name}</Text>
                    <View style={s.chips}>
                      {group.items.map((item) => (
                        <Text key={item.name} style={[s.chip, ...(item.level ? [chipLevel[item.level]] : [])]}>
                          {item.name}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </Section>
            )}

            {show("education") && education.items.length > 0 && (
              <Section title={education.label}>
                {education.items.map((item) => (
                  <View key={item.degree + item.start} style={s.sideItem} wrap={false}>
                    <Text style={s.sideItemTitle}>{item.degree}</Text>
                    <Text style={s.sideItemMeta}>{item.school}</Text>
                    <Text style={s.sideItemMeta}>{range(item.start, item.end, present)}</Text>
                    {item.note && <Text style={s.sideItemMeta}>{item.note}</Text>}
                  </View>
                ))}
              </Section>
            )}

            {show("education") && education.certifications.length > 0 && (
              <Section title={education.certificationsLabel}>
                {education.certifications.map((cert) => (
                  <View key={cert.name} style={s.sideItem} wrap={false}>
                    <Text style={s.sideItemTitle}>{cert.name}</Text>
                    <Text style={s.sideItemMeta}>{[cert.issuer, cert.year].filter(Boolean).join(" · ")}</Text>
                  </View>
                ))}
              </Section>
            )}

            {show("education") && education.languages.length > 0 && (
              <Section title={education.languagesLabel}>
                {education.languages.map((lang) => (
                  <View key={lang.name} style={s.langRow}>
                    <Text style={s.langName}>{lang.name}</Text>
                    <Text style={s.langLevel}>{lang.level}</Text>
                  </View>
                ))}
              </Section>
            )}
          </View>

          {/* Main column */}
          <View style={s.main}>
            {show("about") && (
              <Section title="Profile">
                <Text style={s.profileStatement}>{clean(about.statement)}</Text>
                {about.paragraphs.map((p, i) => (
                  <Text key={i} style={s.paragraph}>
                    {clean(p)}
                  </Text>
                ))}
              </Section>
            )}

            {show("experience") && (
              <Section title={experience.label}>
                {groupByCompany(experience.items).map((group, gi) => (
                  <View key={group.company + gi} style={s.company}>
                    {group.roles.map((role, ri) => (
                      <View key={role.role + role.start} wrap={false}>
                        {/* The employer name always travels with its first role. */}
                        {ri === 0 && (
                          <View style={s.companyRow}>
                            <Text style={s.companyName}>{group.company}</Text>
                            {group.location && <Text style={s.companyMeta}>{group.location}</Text>}
                          </View>
                        )}
                        <View style={s.role}>
                        <View style={s.roleRow}>
                          <Text style={s.roleTitle}>{role.role}</Text>
                          <Text style={s.roleDates}>{range(role.start, role.end, present)}</Text>
                        </View>
                        <Text style={s.summary}>{clean(role.summary)}</Text>
                        {role.highlights.length > 0 && (
                          <View style={s.bullets}>
                            {role.highlights.map((h) => (
                              <View key={h} style={s.bullet}>
                                <Text style={s.bulletDot}>•</Text>
                                <Text style={s.bulletText}>{clean(h)}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {role.tech.length > 0 && (
                          <Text style={s.tech}>
                            <Text style={s.techLabel}>Tech </Text>
                            {role.tech.join(", ")}
                          </Text>
                        )}
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </Section>
            )}

            {show("projects") && projects.items.length > 0 && (
              <Section title={projects.label}>
                {projects.items.map((project) => (
                  <View key={project.name} style={s.project} wrap={false}>
                    <View style={s.projectRow}>
                      {project.url ? (
                        <Link src={project.url} style={s.projectName}>
                          {project.name}
                        </Link>
                      ) : (
                        <Text style={s.projectName}>{project.name}</Text>
                      )}
                      {project.meta && <Text style={s.projectMeta}>{project.meta}</Text>}
                    </View>
                    <Text style={s.summary}>{clean(project.description)}</Text>
                  </View>
                ))}
              </Section>
            )}
          </View>
        </View>

      </Page>
    </Document>
  );
}

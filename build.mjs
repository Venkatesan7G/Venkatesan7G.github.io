#!/usr/bin/env node
/* build.mjs: turns data/*.json + src/template.html + src/art/*.svg into index.html (plus sitemap.xml, robots.txt, 404.html).
   No dependencies. Needs Node 18+.   Run:  node build.mjs      (add --force to skip the claim guard) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const wr = (p, s) => fs.writeFileSync(path.join(root, p), s);
const J = (p) => JSON.parse(rd(p));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fail = (m) => { console.error('\nBUILD STOPPED: ' + m + '\n'); process.exit(1); };

const profile = J('data/profile.json'), figures = J('data/figures.json'), edu = J('data/education.json'),
  exp = J('data/experience.json'), projects = J('data/projects.json'), skills = J('data/skills.json'),
  refs = J('data/references.json');

/* ---- claim guard: wording that was removed on purpose. Edit this list if you ever re-verify one of them. ---- */
const BANNED = [/300%/, /99\.99%/, /\b99\.9%/, /\b35%/, /\$500K/i, /5M\+ daily/i, /home ?lab/i, /\bCKA\b/, /self-supervised/i,
  /\bengineered\b/i, /\bdesigned\b/i, /3 years at Smartlead/i];
if (!process.argv.includes('--force')) {
  const hay = JSON.stringify([profile, edu, exp, projects, skills], (k, v) => (k === '_help' ? undefined : v));
  const hits = BANNED.filter((r) => r.test(hay)).map(String);
  if (hits.length) fail('these removed-on-purpose claims are back in data/*.json: ' + hits.join('  ') + '\nRemove them, or run with --force if you re-checked they are true.');
}

/* ---- references ---- */
const refById = new Map(refs.items.map((r) => [r.id, r]));
let citeN = 0;
const cite = (id) => {
  const r = refById.get(id); if (!r) fail('reference id ' + id + ' not found in data/references.json');
  const tid = 'tip' + id + '-' + (++citeN);
  return `<span class="cite"><button type="button" aria-label="Recommendation ${id} from ${esc(r.name)}" aria-describedby="${tid}">[${id}]</button>` +
    `<span class="tip" role="tooltip" id="${tid}"><q>${esc(r.quote)}</q><b>${esc(r.name)}, ${esc(r.role)}</b>` +
    `<a href="${esc(profile.linkedin)}" target="_blank" rel="noopener">Read on LinkedIn</a></span></span>`;
};

/* ---- figures (numbered in page order because the template is processed top to bottom) ---- */
const scenesJs = rd('assets/js/scenes.js');
let figN = 0;
const fig = (key) => {
  const f = figures[key]; if (!f) fail('no figure "' + key + '" in data/figures.json');
  if (!scenesJs.includes('SCENES.' + f.scene + '=')) fail('scene "' + f.scene + '" not found in assets/js/scenes.js');
  figN++;
  return `<figure class="fig"><canvas data-scene="${esc(f.scene)}" role="img" aria-label="${esc(f.alt)}"></canvas>\n    <figcaption><b>Fig. ${figN}.</b> ${esc(f.caption)}</figcaption></figure>`;
};

/* ---- blocks ---- */
const li = (a) => a.map((x) => `<li>${esc(x)}</li>`).join('\n      ');
const moreBtn = (a, b) => `<summary><span class="moret">${a}</span><span class="less">${b}</span></summary>`;

const educationHtml = edu.items.map((e) =>
  `<div class="job"><div class="jobhead"><h3>${esc(e.school)}</h3><span class="when">${esc(e.when)}</span></div>\n    <p class="sub">${esc(e.degree)}</p></div>`).join('\n  ');

const experienceHtml = exp.items.map((j) => {
  const more = (j.more && j.more.length) ? `\n    <details class="more">${moreBtn('Read more', 'Show less')}<ul>${li(j.more)}</ul></details>` : '';
  const rf = (j.refs && j.refs.length) ? `\n    <p class="said">${j.refs.length > 1 ? exp.refsLabel.many : exp.refsLabel.one} ${j.refs.map(cite).join(' ')}</p>` : '';
  return `<article class="job"><div class="jobhead"><h3>${esc(j.org)}</h3><span class="when">${esc(j.when)}</span></div>\n    <p class="sub">${esc(j.title)}</p>\n    <ul>\n      ${li(j.bullets)}\n    </ul>${more}${rf}</article>`;
}).join('\n\n  ');

const artDir = 'src/art/';
const card = (p) => {
  if (!fs.existsSync(path.join(root, artDir + p.art + '.svg'))) fail('missing art file src/art/' + p.art + '.svg for project "' + p.id + '"');
  const tag = p.tag ? ` <span class="tag">${esc(p.tag)}</span>` : '';
  const link = p.link ? `<p style="margin-top:5px"><a href="${esc(p.link.url)}" target="_blank" rel="noopener">${esc(p.link.label)}</a></p>` : '';
  return `<article class="pc" tabindex="0">\n      <svg viewBox="0 0 160 78" aria-hidden="true">${rd(artDir + p.art + '.svg').trim()}</svg>\n` +
    `      <div class="in"><h4>${esc(p.title)}${tag}</h4><span class="meta">${esc(p.meta)}</span>\n        <p>${esc(p.text)}</p>${link}<div class="hint">${esc(p.hint)}</div></div></article>`;
};
const feat = projects.items.filter((p) => p.featured), rest = projects.items.filter((p) => !p.featured);
const projectsHtml = `<div class="cards">\n    ${feat.map(card).join('\n    ')}\n  </div>` +
  (rest.length ? `\n  <details class="more">${moreBtn('More projects', 'Show fewer projects')}\n  <div class="cards">\n    ${rest.map(card).join('\n    ')}\n  </div></details>` : '');

const skillsHtml = `<dl class="skills">\n    ${skills.groups.map((g) => `<dt>${esc(g.name)}</dt><dd>${esc(g.items)}</dd>`).join('\n    ')}\n  </dl>\n` +
  `  <p class="small note"><b>Currently learning:</b> ${esc(skills.learning.join(' · '))}.</p>`;

const refListHtml = `<ol class="refs">\n    ${refs.items.map((r) => `<li>${cite(r.id)} ${esc(r.name)}, ${esc(r.role)}${r.listNote ? '; ' + esc(r.listNote) : ''} (${esc(r.date)})</li>`).join('\n    ')}\n  </ol>`;

/* ---- head values ---- */
const openTo = profile.openTo.join(' · ');
const description = `${profile.name}: ${profile.jobTitle} with nearly four years of production cloud experience, now an M.Sc. student in Communications and Signal Processing at TU Ilmenau. Open to ${profile.openTo.join(', ')} roles in Germany.`;
const jsonld = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Person', name: profile.name, url: profile.siteUrl + '/', jobTitle: profile.jobTitle,
  description: `${profile.jobTitle}, M.Sc. student in Communications and Signal Processing at TU Ilmenau, open to ${profile.openTo.join(', ')} roles in Germany.`,
  alumniOf: profile.alumniOf.map((n) => ({ '@type': 'CollegeOrUniversity', name: n })),
  address: { '@type': 'PostalAddress', addressLocality: 'Ilmenau', addressCountry: 'DE' },
  knowsLanguage: ['English', 'German', 'Tamil'], knowsAbout: profile.knowsAbout, sameAs: [profile.linkedin, profile.github],
});

const vars = {
  title: `${profile.name} · ${profile.jobTitle}`, description, jsonld, openTo,
  relocationCap: profile.relocation.charAt(0).toUpperCase() + profile.relocation.slice(1),
  education: educationHtml, experience: experienceHtml, projects: projectsHtml, skills: skillsHtml, referenceList: refListHtml,
};
const plain = (k) => (k in vars ? vars[k] : (k in profile ? profile[k] : null));

let html = rd('src/template.html');
html = html.replace(/\{\{(fig:)?([A-Za-z0-9_]+)\}\}/g, (m, isFig, k) => {
  if (isFig) return fig(k);
  const v = plain(k); if (v === null) fail('template placeholder {{' + k + '}} has no value');
  const raw = ['jsonld', 'education', 'experience', 'projects', 'skills', 'referenceList'].includes(k);
  return raw ? v : esc(v);
});
wr('index.html', html);

const today = new Date().toISOString().slice(0, 10);
wr('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${profile.siteUrl}/</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`);
wr('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${profile.siteUrl}/sitemap.xml\n`);
wr('404.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found</title><link rel="stylesheet" href="/assets/css/paper.css"></head><body><div class="wrap"><header><h1>Page not found</h1><p class="role">That page does not exist.</p><p><a class="btn primary" href="/">Go to the profile</a></p></header></div></body></html>\n`);

console.log(`built index.html  (${figN} figures, ${citeN} reference markers, ${projects.items.length} projects, ${(html.length / 1024).toFixed(1)} KB)`);

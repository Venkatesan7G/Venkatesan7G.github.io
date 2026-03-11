# venkatesan7g.github.io

Personal portfolio site. Clean HTML/CSS/JS — no build step, no framework, no dependencies.

## Structure

```
/
├── index.html          ← Home
├── work.html           ← Full work history
├── projects.html       ← Technical projects
├── blog.html           ← Blog index
├── cv.html             ← CV download page
├── assets/
│   ├── css/style.css   ← All styles (single file)
│   └── js/main.js      ← Minimal JS (active nav only)
├── blog/
│   ├── _template.html  ← Copy this for new posts
│   └── *.html          ← Blog posts
└── cv/
    └── *.pdf           ← CV PDFs (add your own)
```

## Adding a blog post

1. Copy `blog/_template.html` to `blog/your-post-slug.html`
2. Edit the title, category, date, and body content
3. Add a link to it in `blog.html` (and optionally `index.html` if it's recent)
4. Commit and push — GitHub Pages deploys automatically

## Adding/updating CVs

Drop PDF files into `cv/` and update the download links in `cv.html`.

## Deployment

Push to the `main` branch of your `venkatesan7g.github.io` repo.
GitHub Pages serves from root automatically. No build step needed.

## Fonts

Uses Google Fonts (DM Mono + DM Sans) loaded via CSS `@import`.
If you want to self-host fonts for offline use, download them from
https://fonts.google.com and update the CSS.

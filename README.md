# Bat-Ochir — Personal portfolio

This is a normal, public-facing personal portfolio website, hosted on **Vercel**. It uses static HTML, CSS, and vanilla JavaScript, with a procedural WebGL background. There is no build step, backend, database, login, or API key requirement.

## Source of truth (SOT)

- **Authoritative source:** this repository, [Enerep/personal-bat-portfolio1](https://github.com/Enerep/personal-bat-portfolio1), on its existing `master` branch.
- **Production hosting:** the existing Vercel project at [bat-portfolio.vercel.app](https://bat-portfolio.vercel.app/). 

## Run locally

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`.

## Website files

- `index.html`: portfolio content, project links, navigation, and contact dialogs.
- `style.css`: responsive layouts, typography, and motion treatments.
- `script.js`: native-scroll integration, motion preferences, navigation, and interactive previews.
- `arrival.js` and `assets/arrival.css`: a short, skippable black-screen intro with ripples and a digital bat. Reduced motion skips it; a timeout always releases the page.
- `assets/achievements.css`: prismatic achievement and exploration-link typography with subtle shimmer.
- `assets/wayfinding.css`: the two entrance routes and the early honors, learning, and experiments section.
- `assets/recognition.css`: the linked XERJ Corpus Hub selection credit for Discovery Galaxy.
- `world.js`: procedural WebGL landscape. Rendering stops after inputs settle, with a lower resolution budget for smaller devices.
- `assets/`: vector project artwork, favicon, and social preview.
- `certificates/`: personal certificate images retained from the earlier portfolio.

RoamRep leads the selected work as an AI discovery platform combining algorithmic recommendations and dynamic restaurant websites, followed by worldlayer.si, Discovery Galaxy, and ProofPatch. The ProofPatch interaction is an illustrative demonstration; it does not run project checks in the browser.

The entrance links directly to projects or the earlier highlights section. Discovery Galaxy's XERJ recognition links to its source listing, which showed selection and licence clearance when checked on October 28, 2026.

The website respects the device's reduced-motion preference and provides a pause control. Content remains available without WebGL. Typography has system fallbacks if Google Fonts cannot load.

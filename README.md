# Saudi Thobe — saudithobe.men

Online system for the shop: owner, branch managers, measurement, cashiers, tailors and the tailoring factory.
Static site on GitHub Pages + Firebase (Auth + Firestore, project `saudithobe`).

- `index.html`, `app.js` — the app (built from `src/` with `python3 src/build.py`)
- `config.js` — Firebase web config
- `firestore.rules` — who may read/write what (paste into Firebase → Firestore → Rules)
- `?demo` — open the site with `?demo` to see it with sample data, no login

## Logins
- Owner: open the site, first time creates the owner account (email + password).
- Everyone else gets a personal link `https://saudithobe.men/?u=<id>&k=<key>`; first open sets a PIN,
  then it can be installed as their own app on phone or PC.

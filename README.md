# The Data-Day Dreamhouse 🏡

A tiny cozy world: isometric apartment, math garden, card binder and a mailbox.
Plain HTML/CSS/JS, no build step, no backend. KaTeX and Google Fonts load from CDNs.

## Put it online (free, GitHub Pages)
1. Create a new GitHub repo (public), e.g. `dreamhouse`.
2. Upload everything in this folder to the repo root (`index.html`, `style.css`, `app.js`, `config.js`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `icon-192.png`, `icon-512.png`).
3. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`. Save.
4. After about a minute the site is live at `https://<your-username>.github.io/dreamhouse/`.

Test locally by double-clicking `index.html`.

## Make it hers (`config.js`)
- `herName`: used in greetings.
- `fromName`: shown on the mailbox.
- `herTitle`: shown before her name ("Princess").
- `packIntervalMinutes`: free pack rhythm (default 360 = every 6 hours, max 3 waiting). Packs also cost 30 🧊.
- `letters`: your first letters live here as a safe fallback. The mailbox flag goes up for any letter she hasn't opened.
- `watchSuggestions` and `decrees`: your picks for her Couch list and your own Royal Decrees.
- `sheetCsvUrl` (optional): add new letters without touching code. Make a Google Sheet with columns `date | title | message`, then File → Share → Publish to web → CSV, and paste that link. Sheet letters are added to the ones in `config.js`; only ever add rows. New rows appear within a few minutes of her next visit, and are cached so they still show offline. Treat letters as semi-public (anyone with the site's source can find the link).

## What's inside
- **Home**: toggle the window (NYC / garden) with the wall switch, drag the Sunset Lamp (it relights the whole page), click the ravioli bowl, and find the bathroom toilet for Wet Rat Mode. Spend Data Cubes on the Panda Tea House.
- **Math Garden**: Fibonacci Flowerbed and Regression Constellations (live R², reach the goal to reveal a capybara).
- **Cards**: 12 Cozy Critters, a Weasel Postman pack every few minutes, duplicates become stardust, stardust makes cards holographic.
- **Mailbox**, **Chill** (capybara hot spring + breathing circle), and Mochi-bot's bubble wrap.
- Mood check-in on every visit: Tired dims everything and pauses puzzles, Sad opens Mochi-bot, Happy makes puzzles harder.
- Progress saves in her browser (localStorage). Music is synthesised in the browser, so there are no audio files or licensing issues.

- **Couch Cinema**: her own anime watchlist with hearts, plus your suggestions.
- Princess touches: crown, Royal Decrees, a sakura tree, falling petals, and a Monster Check from Mochi-bot (no horror anywhere).
- Installable on a phone (Add to Home Screen) and works offline. A backup code in the Chill tab protects her progress if she changes device.

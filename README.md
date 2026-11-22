# Enterprise Decision Co-Pilot

A hackathon prototype that helps product teams evaluate launch decisions. It brings evidence into one view, compares full launch / limited pilot / delay, challenges a chosen option, and records a human-approved next-step plan.

## Features

- Decision intake and evidence library with text, Markdown, CSV, and JSON uploads.
- Evidence-backed claims, exact source citations, missing-evidence callouts, and contradiction summaries.
- Comparison of full launch, limited pilot, and delay options.
- A source-based challenge interaction and human-approved next-step plan.
- PM demo connectors for Slack, Notion, Jira, Linear, Mixpanel, and Google Drive.
- Optional server-side Anthropic analysis with citation validation.
- Responsive interface; saved demo state is local to the current browser.

> **Prototype notice:** The built-in evidence and PM connector samples are fictional. Demo connectors do not authenticate or sync external accounts. This is not a production-ready or multi-user application.

## Run locally

Requires Python 3.9 or newer; there are no package dependencies.

```sh
python3 server.py
```

Open [http://localhost:3000](http://localhost:3000).

## Demo flow

1. Keep the preloaded fictional evidence or add `.txt`, `.md`, `.csv`, or `.json` files.
2. Enter a decision question and choose **Build my decision brief**.
3. Compare the three options, inspect citations, and challenge an option.
4. Enter a decision owner and approve. The saved plan persists in this browser on this device.
5. Browse **PM connectors**, connect a demo integration, and import sample context from Slack, Notion, Jira, Linear, Mixpanel, or Google Drive.
6. A previously built decision brief stays saved after refresh but starts collapsed; use **Show brief** to reopen it.

The built-in evidence pack is fictional. Without a key, the app explicitly labels its curated analysis as **Demo mode**; it is not a live AI result and should not be represented as validated research. The curated result only applies to the bundled question and all four bundled sources. Other questions or source sets produce an insufficient-evidence state instead of reusing the canned recommendation.

## Optional live AI analysis

The app can send the current question and evidence to Anthropic from the local Python server; the API key is never sent to the browser. Set your key before starting the server:

```sh
ANTHROPIC_API_KEY=your-key python3 server.py
```

Optionally set `ANTHROPIC_MODEL` to a model available to your account. The default is `claude-sonnet-4-5-20250929`. The server validates each returned source ID, chunk ID, and exact quote before showing an AI analysis. Provider errors and invalid citations are shown rather than presented as a successful result.

## What works / prototype limits

- Working question → evidence → analysis → option comparison → challenge → human approval flow.
- No API key is needed; analysis is a curated demo path and is explicitly labeled as fictional demo mode.
- A live server-side Anthropic analysis is available when configured with an API key.
- Challenge interaction surfaces excerpts from the actual loaded source text that may weigh against the selected option; it is not presented as an AI review.
- Source citations are checked against the text currently in the evidence library.
- Text uploads are read in the browser and persisted locally; the demo approval record and tasks also persist in browser local storage.
- PM connectors are UI demos only. Connect/disconnect state is local; importing adds fictional sample text as evidence. No external service is authenticated or contacted, and imported sources require live AI (or a future integration) for a new analysis.
- No accounts, shared database, access control, production file storage, or persistent cross-device records. “Saved in this browser” means the data is in local browser storage, not a shared team workspace.
- Uploaded data and approvals stay in this browser only. Do not upload sensitive information.

## Tests

```sh
python3 -m unittest -v
```

## GitHub setup

1. Create an empty repository on GitHub (do not initialize it with a README, license, or `.gitignore`).
2. In this folder, initialize Git if needed, commit the project, add your GitHub repository as `origin`, and push the branch:

   ```sh
   git init
   git add .
   git commit -m "Initial Enterprise Decision Co-Pilot prototype"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

3. Configure `ANTHROPIC_API_KEY` as a local environment variable only when using live analysis. Never commit API keys, `.env` files, or sensitive customer evidence.

No license is included. Choose a license before inviting reuse or contributions; without one, the default copyright rules apply.

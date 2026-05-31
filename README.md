# Mantle Calendar

Mantle Calendar is a streamlined, context-aware calendar interface integrated directly within your Obsidian vault. It allows you to organize schedules, track milestones, and manage task events inside your notes without ever leaving your markdown workspace.

---

## 🎨 Cohesive Styling

Mantle Calendar is deeply integrated with the **Project Mantle** design guidelines. While it runs on any Obsidian theme, it is optimized to pair with the **Zenith theme**, inheriting its visual palette, typography, hover glows, and floating borders.

---

## ✨ Key Features

* **Visual Event Tracking:** Manage schedules, tasks, and notes through a daily or monthly calendar interface.
* **Note Linking:** Double-click any day or event to instantly generate, open, or link to a Markdown file.
* **Responsive Layout:** Automatically scales and fits inside sidebars, tabs, or split-pane configurations.
* **Minimalist Aesthetics:** Subtle parallax patterns and card designs keep your calendar distraction-free.

---

## 📥 Installation

### Method A: Via Obsidian Community Directory (Recommended)
1. Go to **Settings** > **Community plugins** > **Browse**.
2. Search for **Mantle Calendar**.
3. Click **Install**, then click **Enable**.

### Method B: Via BRAT (Beta Reviewer's Auto-update Tester)
1. Install the **BRAT** plugin from Obsidian's community store.
2. In BRAT settings, click **Add Beta plugin** and enter:
   `https://github.com/carnalMATRIX/obsidian-mantle-calendar`
3. Click **Add Plugin** to download and auto-update.

### Method C: Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub Release](https://github.com/carnalMATRIX/obsidian-mantle-calendar/releases).
2. Inside your vault, navigate to `.obsidian/plugins/`.
3. Create a folder named `mantle-calendar` and paste the three downloaded files inside.
4. Restart Obsidian, go to **Settings** > **Community plugins**, and enable **Mantle Calendar**.

---

## 🔍 Troubleshooting

### Calendar does not appear or load
* **Reload Vault:** Use `Cmd+R` (macOS) or `Ctrl+R` (Windows) to force-reload Obsidian's UI.
* **Enable Community Plugins:** Check that "Community plugins" are turned ON in settings.

### Events are not linking to files
* **Daily Notes Settings:** Ensure your default folder for daily notes is configured and exists in your vault.
* **Permitted File Names:** Ensure your linked notes use valid filesystem filenames (avoid characters like `:`, `/`, or `\`).

---

## 🛠️ Development

If you wish to build or customize this plugin locally:
1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the compiler in watch mode:
   ```bash
   npm run dev
   ```
4. Build minified production code:
   ```bash
   npm run build
   ```

---

## 📄 License

Copyright (c) 2026 Ryan Bakker. Released under a **Personal Use License**. Non-commercial, personal use only. Redistribution or modification for distribution is strictly prohibited. See the `LICENSE` file for full terms.

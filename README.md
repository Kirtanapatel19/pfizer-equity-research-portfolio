# Pfizer Equity Research Portfolio Website (GitHub Pages)

This folder is fully ready for public hosting on GitHub Pages.

## Files

- `index.html` -> main portfolio website
- `styles.css` -> portfolio styling
- `app.js` -> report render + table of contents + export controls
- `report.md` -> full final draft content
- `pfizer-logo.png` and `rbs.jpg` -> branding assets

## Quick Publish (No Terminal)

1. Create a new GitHub repository (example: `pfizer-equity-research-portfolio`).
2. Upload all files from this folder to the repo root.
3. In GitHub repo settings, open **Pages**.
4. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.
6. Your public link will appear in 1-3 minutes:
   - `https://<your-github-username>.github.io/<repo-name>/`

## Publish With Terminal (Optional)

```powershell
cd "C:\Users\Administrator\Desktop\VSCODE\PFIZER\CHANGES FINAL\GITHUB_PORTFOLIO_WEBSITE"
gh auth login -h github.com
git init
git add .
git commit -m "Add Pfizer equity research portfolio website"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then enable GitHub Pages in repo settings.

If `gh auth status` says token is invalid, run:

```powershell
gh auth logout -h github.com -u <your-username>
gh auth login -h github.com
```

## Notes

- The site renders the report from `report.md`, so content edits only require updating that file.
- Use **Export PDF** in the site for a printable version.
- This project is educational and not investment advice.

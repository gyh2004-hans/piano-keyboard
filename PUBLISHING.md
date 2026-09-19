# Publish to GitHub

Create an empty GitHub repository named `piano-keyboard`. Do not initialize it with a README, license, or `.gitignore`, because those files are already included here.

Replace `USERNAME` in the remote URL, then run:

```powershell
cd D:\pycharmProjects\AI_work_p\keyboard-piano\piano-keyboard
git init
git add .
git commit -m "feat: add piano-keyboard agent skill"
git branch -M main
git remote add origin https://github.com/USERNAME/piano-keyboard.git
git push -u origin main
```

If Git asks for an identity before the first commit, configure it with your own details:

```powershell
git config user.name "YOUR NAME"
git config user.email "YOUR EMAIL"
```

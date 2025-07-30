# GitHub Pages Deployment Guide

## 🚀 Deployment Methods

### Method 1: Automatic with GitHub Actions (Recommended)

1. **Push your code to GitHub** (if not already there)
2. **Go to your repository on GitHub**
3. **Navigate to Settings → Pages**
4. **Select Source: "GitHub Actions"**
5. **The workflow will automatically deploy when you push to main**

The `.github/workflows/deploy.yml` file will handle the deployment automatically.

### Method 2: Direct Branch Deployment (Simple)

1. **Push your code to GitHub**
2. **Go to Settings → Pages**
3. **Select Source: "Deploy from a branch"**
4. **Choose: Branch `main`, Folder `/` (root)**
5. **Save**

## 📁 Project Structure

Your site will be available at: `https://[username].github.io/[repository-name]/`

### Main Files:
- `index.html` - Main application
- `src/` - All JavaScript and CSS files
- `src/sudokupad/` - SudokuPad utilities

### Excluded from Deployment:
- `temp-reference-3/` - Reference repository (excluded via .gitignore)
- `tests/` - Jest test files (development only)
- `debug/` - Debug files
- `node_modules/` - Dependencies

## 🔧 CORS Considerations

The app makes requests to:
- `https://sudokupad.app/api/puzzle/` - Main API
- `https://sudokupad.svencodes.com/ctclegacy/` - Legacy proxy
- `https://firebasestorage.googleapis.com/` - Firebase storage

These should work from GitHub Pages as they have appropriate CORS headers.

## 🧪 Testing After Deployment

1. **Visit your GitHub Pages URL**
2. **Test with a puzzle**: `?puzzle=psxczr0jpr`
3. **Try customizing colors**
4. **Test the export functionality**

## 🐛 Troubleshooting

If you encounter issues:

1. **Check GitHub Actions logs** (if using Actions deployment)
2. **Verify all file paths are relative** (no absolute paths)
3. **Test CORS issues** in browser dev tools
4. **Check console for JavaScript errors**

## 📝 Custom Domain (Optional)

To use a custom domain:

1. **Add a `CNAME` file** to the root with your domain
2. **Configure DNS** to point to GitHub Pages
3. **Update GitHub Pages settings** to use custom domain
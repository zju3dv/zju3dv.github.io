# GitHub Pages Deployment Guide

This guide will help you deploy your H2Char project to GitHub Pages.

## Prerequisites

- GitHub account
- Repository named `H2Char` (or `username.github.io` for personal site)
- Git installed locally

## Step-by-Step Deployment

### 1. Create GitHub Repository

1. Go to GitHub and create a new repository named `H2Char`
2. Make it public (required for free GitHub Pages)
3. Add a description: "H2Char: Advanced 3D Character Motion Retargeting"

### 2. Push Your Code

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: H2Char project homepage"

# Add remote repository
git remote add origin https://github.com/yourusername/H2Char.git

# Push to GitHub
git push -u origin main
```

### 3. Configure GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 4. Verify Deployment

After pushing your code:
- GitHub Actions will automatically deploy your site
- Check the Actions tab to monitor deployment progress
- Your site will be available at: `https://yourusername.github.io/H2Char`

## Custom Domain (Optional)

### Option A: Subdomain

1. Edit the `CNAME` file with your domain:
```
h2char.yourdomain.com
```

2. Configure DNS:
```
Type: CNAME
Name: h2char
Value: yourusername.github.io
```

### Option B: Apex Domain

1. Edit the `CNAME` file:
```
yourdomain.com
```

2. Configure DNS:
```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

## Repository Settings

### Recommended Repository Settings

- **Description**: "H2Char: Advanced 3D Character Motion Retargeting System"
- **Topics**: motion-retargeting, 3d-animation, character-animation, computer-graphics, deep-learning
- **Website**: https://yourusername.github.io/H2Char
- **Enable Discussions**: ✓
- **Enable Issues**: ✓
- **Enable Wiki**: ✓

### Social Preview

Add a social preview image (1280×640px) named `social-preview.png` in the root directory.

## Testing Locally

### Using Python HTTP Server

```bash
cd H2CharWeb
python -m http.server 8000
# Visit http://localhost:8000
```

### Using Live Server (VS Code)

1. Install Live Server extension
2. Right-click `index.html` → "Open with Live Server"

## Troubleshooting

### Common Issues

**Site not deploying:**
- Check GitHub Actions workflow runs
- Verify repository is public
- Ensure `index.html` is in root directory

**Custom domain not working:**
- Verify DNS propagation (can take up to 24 hours)
- Check CNAME file format
- Ensure HTTPS is enabled in GitHub Pages settings

**Assets not loading:**
- Check file paths in HTML/CSS
- Verify asset files are committed
- Test with relative paths

### Performance Optimization

1. **Image Optimization:**
```bash
# Install image optimization tools
npm install -g imagemin-cli imagemin-jpegoptim imagemin-pngquant

# Optimize images
imagemin assets/images/* --out-dir=assets/images/optimized
```

2. **Video Optimization:**
```bash
# Compress videos
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 output.mp4
```

3. **CSS/JS Minification:**
```bash
# Install minification tools
npm install -g uglify-js clean-css-cli

# Minify files
uglifyjs js/script.js -o js/script.min.js
cleancss css/style.css -o css/style.min.css
```

## Monitoring

### GitHub Pages Status

- Monitor deployment status in GitHub Actions
- Check site availability regularly
- Set up uptime monitoring (e.g., UptimeRobot)

### Analytics

Add Google Analytics:
```html
<!-- Add to index.html head -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Maintenance

### Regular Updates

- Update dependencies regularly
- Monitor for security vulnerabilities
- Keep documentation current

### Backup Strategy

- Regular repository backups
- Export critical data
- Document deployment process

## Support

If you encounter issues:
1. Check GitHub Pages documentation
2. Review GitHub Community discussions
3. Contact GitHub Support for platform issues

---

Your H2Char project homepage is now ready for GitHub Pages deployment! 🚀
# EggFusion Academic Project Page

This is an academic project page based on the excellent template from [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template) and inspired by the VVMC project template.

## Features

- **Responsive Design**: Built with Bulma CSS framework for modern, mobile-friendly design
- **Interactive Elements**: Carousel for images and videos, smooth animations
- **Academic Focus**: Optimized for research paper presentation with sections for:
  - Abstract
  - Results visualization
  - Video presentations
  - Image carousels
  - BibTeX citations
  - Social media integration

## Setup Instructions

1. **Replace placeholder content**:
   - Update all author information in `index.html`
   - Replace placeholder URLs with actual links
   - Add your paper's arXiv ID
   - Update meta tags for better SEO

2. **Add your content**:
   - Replace images in `static/images/` with your research figures
   - Add videos to `static/videos/`
   - Update the abstract and other text content
   - Add your PDF papers to `static/pdfs/`

3. **Customize styling**:
   - Modify colors and fonts in `static/css/index.css`
   - Adjust layout if needed

## File Structure

```
eggfusion-page/
├── index.html                 # Main page
├── static/
│   ├── css/
│   │   ├── bulma.min.css     # Bulma CSS framework
│   │   ├── bulma-carousel.min.css
│   │   ├── bulma-slider.min.css
│   │   ├── fontawesome.all.min.css
│   │   └── index.css         # Custom styles
│   ├── js/
│   │   ├── bulma-carousel.min.js
│   │   ├── bulma-slider.min.js
│   │   ├── fontawesome.all.min.js
│   │   └── index.js          # Custom JavaScript
│   ├── images/
│   │   ├── carousel1.jpg     # Add your images here
│   │   ├── carousel2.jpg
│   │   ├── carousel3.jpg
│   │   └── carousel4.jpg
│   ├── videos/               # Add your videos here
│   └── pdfs/                 # Add your PDFs here
├── serve.sh                  # Local server script
└── README.md
```

## Usage

1. **Local Development**:
   ```bash
   ./serve.sh
   ```
   This will start a local server for testing.

2. **Deployment**:
   - Upload to any web server
   - Can be deployed to GitHub Pages, Netlify, or similar services

## Customization Tips

1. **Meta Tags**: Update social media meta tags for better sharing
2. **Colors**: Modify the CSS color scheme to match your institution or preferences
3. **Fonts**: Google Fonts are already included, you can add more in the head section
4. **Icons**: FontAwesome icons are available throughout the template
5. **Carousel**: Add or remove carousel items as needed

## Credits

- Original template: [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template)
- Inspired by: [VVMC Project](https://suikasibyl.github.io/vvmc/)
- CSS Framework: [Bulma](https://bulma.io/)
- Icons: [FontAwesome](https://fontawesome.com/)

## License

This website template is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

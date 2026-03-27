# H2Char - 3D Character Motion Retargeting

![H2Char Teaser](assets/images/teaser.jpg)

H2Char is a state-of-the-art 3D character motion retargeting system that enables seamless transfer of human motions to various character models while preserving motion quality and character-specific features.

## 🌟 Features

- **Real-time Performance**: Optimized for real-time motion retargeting applications
- **Self-penetration Free**: Advanced collision detection and resolution
- **Contact Preservation**: Maintains important contact points and interactions
- **Multi-character Support**: Works with various character models and skeletons
- **High Quality**: Produces natural-looking character animations

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PyTorch 1.10+
- Blender (for visualization)
- FFmpeg (for video processing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/H2Char.git
cd H2Char
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Download pre-trained models:
```bash
python scripts/download_models.py
```

### Basic Usage

```python
from h2char import MotionRetargeter

# Initialize retargeter
retargeter = MotionRetargeter()

# Load source motion and target character
source_motion = load_motion('path/to/source.bvh')
target_character = load_character('path/to/character.fbx')

# Perform retargeting
result_animation = retargeter.retarget(source_motion, target_character)

# Save result
result_animation.save('output/retargeted_animation.fbx')
```

## 📺 Demo Videos

Check out our [demo videos](index.html#demo) to see H2Char in action:
- 2-minute explanation video
- 10+ motion demonstration videos
- Various character examples

## 📄 Paper

Read our research paper for technical details:
[Download PDF](docs/paper.pdf)

## 🏗️ GitHub Pages Deployment

This project is configured for GitHub Pages deployment. To deploy:

1. Push your code to GitHub repository
2. Go to Repository Settings → Pages
3. Select "GitHub Actions" as source
4. The site will be automatically deployed to:
   - `https://yourusername.github.io/H2Char` (if repository name is H2Char)
   - `https://yourusername.github.io` (if repository name is username.github.io)

### Custom Domain (Optional)

To use a custom domain:
1. Edit the `CNAME` file with your domain
2. Configure DNS settings with your domain provider
3. Enable HTTPS in GitHub Pages settings

## 🗂️ Code Structure

```
H2Char/
├── src/                    # Source code
│   ├── core/              # Core retargeting algorithms
│   ├── utils/             # Utility functions
│   └── visualization/     # Visualization tools
├── configs/               # Configuration files
├── checkpoints/           # Pre-trained models
├── datasets/              # Dataset processing
├── scripts/               # Helper scripts
└── docs/                  # Documentation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📝 Citation

If you use H2Char in your research, please cite our paper:

```bibtex
@inproceedings{h2char2024,
  title={H2Char: Hierarchical Human-to-Character Motion Retargeting},
  author={Author Name et al.},
  booktitle={Conference Name},
  year={2024}
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions and collaborations, please contact:
- Email: email@example.com
- Twitter: @username
- GitHub: [yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Thanks to Mixamo for character models
- Thanks to AMASS
- Supported by [Your Institution/Affiliation]
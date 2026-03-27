# Installation Guide

This guide will help you set up H2Char on your system.

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+, Windows 10+, or macOS 10.15+
- **CPU**: 4+ cores
- **RAM**: 16GB+
- **GPU**: NVIDIA GPU with 8GB+ VRAM (recommended)
- **Storage**: 50GB+ free space

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 8+ cores
- **RAM**: 32GB
- **GPU**: NVIDIA RTX 3080+ with 12GB+ VRAM
- **Storage**: 100GB+ SSD

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/H2Char.git
cd H2Char
```

## Step 2: Install Dependencies

### Python Dependencies

Create a conda environment (recommended):
```bash
conda create -n h2char python=3.9
conda activate h2char
```

Or use virtualenv:
```bash
python -m venv h2char-env
source h2char-env/bin/activate  # Linux/Mac
# or
h2char-env\Scripts\activate    # Windows
```

Install Python packages:
```bash
pip install -r requirements.txt
```

### System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg blender python3-dev python3-pip
```

**Windows:**
- Download and install [FFmpeg](https://ffmpeg.org/download.html)
- Download and install [Blender](https://www.blender.org/download/)
- Add both to your system PATH

**macOS:**
```bash
brew install ffmpeg blender
```

## Step 3: Download Pre-trained Models

Download the pre-trained models:
```bash
python scripts/download_models.py
```

Or manually download from:
- [Model Checkpoint 1](https://example.com/models/model1.pth)
- [Model Checkpoint 2](https://example.com/models/model2.pth)
- [Model Checkpoint 3](https://example.com/models/model3.pth)

Place downloaded models in the `checkpoints/` directory.

## Step 4: Verify Installation

Run the verification script:
```bash
python scripts/verify_installation.py
```

This will check:
- Python dependencies ✓
- System tools (FFmpeg, Blender) ✓
- GPU availability ✓
- Model files ✓

## Step 5: Test with Example Data

Download example data:
```bash
python scripts/download_examples.py
```

Run a test retargeting:
```bash
python examples/basic_retargeting.py
```

## Docker Installation (Alternative)

### Build Docker Image
```bash
docker build -t h2char .
```

### Run Container
```bash
docker run -it --gpus all -v $(pwd)/data:/app/data h2char
```

## Troubleshooting

### Common Issues

1. **CUDA Errors**:
   ```bash
   # Check CUDA version
   nvidia-smi
   # Reinstall PyTorch with correct CUDA version
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
   ```

2. **Blender Not Found**:
   ```bash
   # Set Blender path
   export BLENDER_PATH=/path/to/blender
   ```

3. **FFmpeg Issues**:
   ```bash
   # Verify FFmpeg installation
   ffmpeg -version
   ```

4. **Memory Errors**:
   - Reduce batch size in config
   - Use CPU mode for testing

### Getting Help

If you encounter issues:
1. Check the [FAQ](faq.md)
2. Search existing [GitHub Issues](https://github.com/yourusername/H2Char/issues)
3. Create a new issue with:
   - System information
   - Error messages
   - Steps to reproduce

## Development Setup

For developers:
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Setup pre-commit hooks
pre-commit install

# Run tests
pytest tests/
```

## Update Instructions

To update to the latest version:
```bash
git pull origin main
pip install -r requirements.txt --upgrade
python scripts/download_models.py --update
```
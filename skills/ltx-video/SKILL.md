---
name: ltx-video
description: >
  Generates AI video clips with synchronized audio locally using LTX-2.3 (Lightricks, 22B params) on your GPU.
  Text-to-video, image-to-video, audio-to-video. No API key, no cloud, 100% local.
  Supports NVIDIA (CUDA) and AMD (ROCm). Uses ComfyUI Desktop as backend.
  Apache 2.0 license. Output clips are used as backgrounds in Remotion compositions.
description_pt-BR: >
  Gera clips de vídeo com áudio sincronizado usando LTX-2.3 (Lightricks, 22B parâmetros) na sua GPU.
  Text-to-video, image-to-video, audio-to-video. Sem API key, sem nuvem, 100% local.
  Suporta NVIDIA (CUDA) e AMD (ROCm). Usa ComfyUI Desktop como backend.
  Licença Apache 2.0. Os clips são usados como fundos em composições do Remotion.
description_es: >
  Genera clips de video con audio sincronizado usando LTX-2.3 (Lightricks, 22B parámetros) en tu GPU.
  Text-to-video, image-to-video, audio-to-video. Sin API key, sin nube, 100% local.
  Soporta NVIDIA (CUDA) y AMD (ROCm). Usa ComfyUI Desktop como backend.
  Licencia Apache 2.0. Los clips se usan como fondos en composiciones de Remotion.
type: script
version: "2.3.0"
script:
  path: scripts/generate.js
  runtime: node
  invoke: "node {skill_path}/scripts/generate.js --prompt \"{prompt}\" --output \"{output}\" --width {width} --height {height} --frames {frames} --steps {steps}"
categories: [video, ai, content, audio]
---

# LTX-2.3 — AI Video + Audio Generator (Local, 22B params)

## What's New in 2.3 (vs 2.0)

- **22 billion parameters** (massive quality jump)
- **Native audio generation** — describe sounds in prompt, audio is generated in sync
- **4x larger text connector** — much better prompt adherence
- **Rebuilt latent space** + new VAE — sharper fine details
- **Native portrait mode** — up to 1080x1920 (9:16)
- **24/48 FPS** options
- **Spatial upscaler 2x** — render at low res, upscale to final
- **Image-to-video** with reduced artifacts
- **Audio-to-video** — generate video driven by audio input
- **Last-frame interpolation** for smooth loops
- **Up to 20s clips at 4K**
- **FP8 quantization** — reduces VRAM usage significantly
- **Two-stage pipeline** — draft + refine for better quality
- **Apache 2.0 license** — fully commercial use

## When to use

Use this skill when you need **AI-generated video clips with audio** for:
- Cinematic B-roll backgrounds for Reels/Stories/Shorts
- Scene transitions and ambient footage with matching sound
- Product showcases and lifestyle clips
- Talking head videos from audio + face image
- Abstract/artistic visual loops with soundtrack
- Any video content that can't be filmed manually

The generated clips are typically used as **backgrounds in Remotion compositions**, with text overlays and branding added on top.

**Do NOT use for:** text animations, branded slides, carousels → use **Remotion** instead.

## Architecture

```
Agent writes prompt → generate.js → ComfyUI API (:8000) → GPU render → MP4 output
                                         ↓
                                    LTX-2.3 FP8
                                    (22B params)
                                         ↓
                                    AMD RX 9070 XT
                                    (16GB VRAM, ROCm)
```

**ComfyUI Desktop** is the rendering backend. The agent calls a Node.js wrapper script
that sends a workflow to ComfyUI's REST API, waits for the render, and downloads the output.

### How the agent uses this skill

1. The pipeline runner reads this SKILL.md
2. For each scene that needs video, the agent runs:
   ```bash
   node skills/ltx-video/scripts/generate.js \
     --prompt "Your detailed prompt with audio description" \
     --output "squads/{squad}/output/{run_id}/video/assets/bg-clip-01.mp4" \
     --width 768 --height 512 --frames 97 --steps 20
   ```
3. The script sends the workflow to ComfyUI, waits for render, saves the MP4
4. The agent passes the clip to Remotion for text overlays and branding

### Requirements

- **ComfyUI Desktop must be running** before the pipeline starts
- Workflow JSON at `skills/ltx-video/scripts/workflow-ltx23.json` (export from ComfyUI)
- LTX-2.3 model loaded in ComfyUI

## Prerequisites

### GPU Requirements

| GPU | VRAM | Support | Max Quality |
|-----|------|---------|-------------|
| NVIDIA RTX 4090/5090 | 24GB | ✅ Native CUDA | 1080p, 20s clips |
| NVIDIA RTX 4070 Ti Super | 16GB | ✅ CUDA + FP8 | 768p, 5s clips |
| NVIDIA RTX 3060-4060 | 8-12GB | ✅ CUDA + FP8 | 512p, 4s clips |
| AMD RX 9070 XT | 16GB | ⚠️ DirectML (experimental) | 768p, 4s clips |
| AMD RX 7900 XTX | 24GB | ⚠️ ROCm (Linux only) | 768p, 5s clips |
| No dedicated GPU | — | ❌ Not supported | — |

### Installation

**Step 1 — Python environment (run once):**
```bash
python -m venv .opensquad-services/ltx-venv
# Windows
.opensquad-services\ltx-venv\Scripts\activate
# Linux/Mac
source .opensquad-services/ltx-venv/bin/activate
```

**Step 2 — Install PyTorch (choose YOUR GPU):**

For NVIDIA (CUDA 12.8):
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
```

For AMD on Windows (DirectML):
```bash
pip install torch torchvision torchaudio
pip install torch-directml
```

For AMD on Linux (ROCm 6.3):
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.3
```

**Step 3 — Install LTX-2.3 packages:**
```bash
pip install ltx-core ltx-pipelines
```

**Step 4 — Download models (first run only, ~45GB total):**

Download these files from [Hugging Face — Lightricks/LTX-2.3](https://huggingface.co/Lightricks/LTX-2.3):

```
models/
  ltx-2.3-22b-dev.safetensors           # Main model (~40GB)
  ltx-2.3-22b-distilled-lora-384.safetensors  # Distilled LoRA for speed
  ltx-2.3-spatial-upscaler-x2-1.0.safetensors # 2x spatial upscaler
```

Also download Gemma-3 for prompt enhancement:
```bash
# Via Hugging Face CLI
huggingface-cli download google/gemma-3-12b-it-qat-q4_0-unquantized --local-dir models/gemma
```

Store all models in `.opensquad-services/ltx-models/`.

### Verify Installation

```bash
python -c "
import torch
print('PyTorch:', torch.__version__)
print('CUDA available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('GPU:', torch.cuda.get_device_name(0))
    print('VRAM:', round(torch.cuda.get_device_properties(0).total_mem / 1024**3, 1), 'GB')
from ltx_pipelines.ti2vid_two_stages import TI2VidTwoStagesPipeline
print('LTX-2.3 pipeline: OK')
"
```

## Instructions

### Core Workflow

1. **Read the roteiro** — Extract visual + audio descriptions for each scene. Look for:
   - `[Visual: description]` tags
   - `[Audio: description]` tags (NEW in 2.3)
   - Scene mood/atmosphere notes
   - Color palette references

2. **Craft the prompt** — Write a detailed video + audio prompt:
   ```
   Cinematic shot of a motorcycle club riding through São Paulo streets at sunset.
   Low angle, warm golden light, smooth tracking shot. Harley Davidson motorcycles,
   leather jackets, urban backdrop. Slow motion, professional film look.
   The audio features deep engine rumble, wind noise, and distant city traffic.
   ```

3. **Generate the clip locally** — Run this Python script:

```python
import torch
from ltx_core.loader import LTXV_LORA_COMFY_RENAMING_MAP, LoraPathStrengthAndSDOps
from ltx_core.components.guiders import MultiModalGuiderParams
from ltx_core.quantization import QuantizationPolicy
from ltx_pipelines.ti2vid_two_stages import TI2VidTwoStagesPipeline
from ltx_pipelines.utils.media_io import encode_video

MODELS_DIR = ".opensquad-services/ltx-models"

# Distilled LoRA for faster two-stage refinement
distilled_lora = [
    LoraPathStrengthAndSDOps(
        f"{MODELS_DIR}/ltx-2.3-22b-distilled-lora-384.safetensors",
        0.6,
        LTXV_LORA_COMFY_RENAMING_MAP
    ),
]

# Initialize pipeline (FP8 quantization saves ~40% VRAM)
pipeline = TI2VidTwoStagesPipeline(
    checkpoint_path=f"{MODELS_DIR}/ltx-2.3-22b-dev.safetensors",
    distilled_lora=distilled_lora,
    spatial_upsampler_path=f"{MODELS_DIR}/ltx-2.3-spatial-upscaler-x2-1.0.safetensors",
    gemma_root=f"{MODELS_DIR}/gemma",
    loras=[],
    quantization=QuantizationPolicy.fp8_cast(),  # Remove if 24GB+ VRAM
)

# Guidance params — controls quality vs prompt adherence
video_guider = MultiModalGuiderParams(
    cfg_scale=3.0, stg_scale=1.0, stg_blocks=[29],
    rescale_scale=0.7, modality_scale=3.0, skip_step=0,
)
audio_guider = MultiModalGuiderParams(
    cfg_scale=7.0, stg_scale=1.0, stg_blocks=[29],
    rescale_scale=0.7, modality_scale=3.0, skip_step=0,
)

# Generate video + audio
video, audio = pipeline(
    prompt="Your detailed prompt here. Describe both visuals AND audio.",
    negative_prompt="worst quality, blurry, jittery, distorted, text, watermark",
    seed=42,
    height=768,
    width=1024,
    num_frames=121,        # Must satisfy: (frames - 1) % 8 == 0
    frame_rate=25.0,
    num_inference_steps=40,  # 20 for drafts, 40 for final
    video_guider_params=video_guider,
    audio_guider_params=audio_guider,
    images=[],              # Empty for text-to-video
    enhance_prompt=True,    # Uses Gemma to improve prompt
)

# Save with synchronized audio
encode_video(
    video=video, fps=25.0, audio=audio,
    output_path="output/video/assets/bg-clip-01.mp4",
    video_chunks_number=1,
)
print("Done! Clip saved with audio.")
```

4. **Use in Remotion** — Import the clip in your Remotion composition as background.

### CLI Alternative (simpler)

```bash
python -m ltx_pipelines.ti2vid_two_stages \
    --checkpoint-path .opensquad-services/ltx-models/ltx-2.3-22b-dev.safetensors \
    --distilled-lora .opensquad-services/ltx-models/ltx-2.3-22b-distilled-lora-384.safetensors 0.6 \
    --spatial-upsampler-path .opensquad-services/ltx-models/ltx-2.3-spatial-upscaler-x2-1.0.safetensors \
    --gemma-root .opensquad-services/ltx-models/gemma \
    --prompt "Your detailed prompt here" \
    --height 768 --width 1024 \
    --num-frames 121 \
    --output-path output/video/assets/bg-clip-01.mp4
```

### Image-to-Video (animate a still image)

```bash
python -m ltx_pipelines.ti2vid_two_stages \
    --checkpoint-path .opensquad-services/ltx-models/ltx-2.3-22b-dev.safetensors \
    --distilled-lora .opensquad-services/ltx-models/ltx-2.3-22b-distilled-lora-384.safetensors 0.6 \
    --spatial-upsampler-path .opensquad-services/ltx-models/ltx-2.3-spatial-upscaler-x2-1.0.safetensors \
    --gemma-root .opensquad-services/ltx-models/gemma \
    --images first_frame.jpg 0 1.0 33 \
    --prompt "The scene comes alive with gentle movement and natural light" \
    --height 768 --width 1024 \
    --num-frames 97 \
    --output-path output/video/assets/animated-scene.mp4
```

### Audio-to-Video (generate video from audio)

```bash
python -m ltx_pipelines.a2vid_two_stage \
    --checkpoint-path .opensquad-services/ltx-models/ltx-2.3-22b-dev.safetensors \
    --distilled-lora .opensquad-services/ltx-models/ltx-2.3-22b-distilled-lora-384.safetensors 0.6 \
    --spatial-upsampler-path .opensquad-services/ltx-models/ltx-2.3-spatial-upscaler-x2-1.0.safetensors \
    --gemma-root .opensquad-services/ltx-models/gemma \
    --audio-path input_audio.wav \
    --audio-start-time 0.0 \
    --audio-max-duration 5.0 \
    --prompt "A musician playing in a studio" \
    --height 768 --width 1024 \
    --num-frames 121 \
    --output-path output/video/assets/audio-driven.mp4
```

### Resolution Guide by VRAM

Start LOW and increase gradually. Never jump straight to max resolution.

| VRAM | Safe Resolution | Max Frames | Duration | FP8 | Notes |
|------|----------------|------------|----------|-----|-------|
| 8GB | 512x384 | 49 | 2s | Required | Tight, drafts only |
| 12GB | 640x480 | 73 | 3s | Required | Good for previews |
| 16GB | 768x512 | 97 | 4s | Recommended | Your 9070 XT max |
| 16GB+FP8 | 1024x768 | 97 | 4s | Yes | Better quality |
| 24GB | 1024x768 | 121 | 5s | Optional | Full quality |
| 24GB+FP8 | 1920x1080 | 161 | 7s | Yes | Max quality |

### Prompt Engineering

#### Structure (include audio description!)
```
[Camera movement] of [subject] in [environment] during [time/lighting].
[Cinematic style], [mood]. [Technical details].
The audio features [sound description, ambient sounds, music style].
```

#### Good Prompts (with audio)
```
Smooth tracking shot of custom motorcycles parked outside a garage at night.
Neon lights reflecting on chrome, cinematic film grain, shallow depth of field.
The audio features a low idling engine rumble and distant city traffic.

Aerial drone shot following a group of bikers on a coastal highway.
Golden hour, warm tones, 4K cinematic quality, slow motion.
The audio includes wind rushing, waves crashing, and a powerful exhaust note.

Close-up of motorcycle engine starting, exhaust smoke rising in slow motion.
Dark moody lighting, high contrast, professional commercial look.
The audio captures the sharp engine crank, followed by a deep V-twin rumble.
```

#### Negative Prompt (always include)
```
worst quality, blurry, jittery, distorted, text, watermark, cartoon, anime,
oversaturated, overexposed, shaky camera
```

### Guidance Parameters Reference

| Parameter | What it does | Recommended |
|-----------|-------------|-------------|
| `cfg_scale` (video) | Prompt adherence for visuals | 3.0 (natural) — 5.0 (strict) |
| `cfg_scale` (audio) | Prompt adherence for audio | 7.0 |
| `stg_scale` | Spatio-temporal guidance strength | 1.0 |
| `rescale_scale` | Prevents over-saturation | 0.7 |
| `modality_scale` | Audio-video sync strength | 3.0 |
| `num_inference_steps` | Quality vs speed | 20 (draft) — 40 (final) |
| `enhance_prompt` | Use Gemma to enrich prompt | True (recommended) |

### GPU Safety

- Your GPU has **thermal protection** — it throttles before any damage
- Monitor temp: open **Task Manager → Performance → GPU** during render
- If GPU temp > 85°C: reduce resolution or improve case ventilation
- If PC freezes: hard reset is safe, no data loss
- Process is killable anytime with **Ctrl+C**
- **Nothing is irreversible** — worst case is a wasted render

### Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `CUDA out of memory` | Resolution too high for VRAM | Reduce width/height, use FP8 quantization |
| `torch_directml not found` | DirectML not installed | `pip install torch-directml` |
| `No module named ltx_core` | LTX-2.3 not installed | `pip install ltx-core ltx-pipelines` |
| `Model not found` | Checkpoints not downloaded | Download from HuggingFace |
| `(frames - 1) % 8 != 0` | Invalid frame count | Use: 49, 73, 97, 121, 161 |
| Freeze/crash | GPU overloaded | Reduce resolution, enable FP8, restart |

### Best Practices

- **Start at 512x384** on first test to confirm GPU works
- Increase resolution gradually: 512 → 640 → 768 → 1024
- Use **FP8 quantization** if VRAM < 24GB
- Use **20 inference steps** for drafts, **40 for final quality**
- Use **cfg_scale 3.0** for natural video, **5.0** for strict prompt following
- **Include audio descriptions** in every prompt — it's free quality
- Keep clips at **4-5 seconds** (97-121 frames) — Remotion can loop/slow them
- Generate 2-3 variants per scene and pick the best
- Name clips descriptively: `bg-motorcycle-sunset-01.mp4`
- Save prompts in `prompts.json` alongside clips for reproducibility
- Use **image-to-video** for consistent character scenes (provide first frame)

### Integration with Remotion

After generating clips, the Remotion skill composes the final video:

```
LTX-2.3 generates (local):      Remotion adds:
├── bg-clip-01.mp4 (+ audio) →   ├── Text overlay (headline)
├── bg-clip-02.mp4 (+ audio) →   ├── Brand logo watermark
├── bg-clip-03.mp4 (+ audio) →   ├── CTA text + animation
└── bg-clip-04.mp4 (+ audio) →   └── Transitions between scenes
                                       └── final-reel.mp4
```

### Output Structure

```
output/
  video/
    assets/
      bg-motorcycle-sunset-01.mp4    # LTX-2.3 clip with audio
      bg-motorcycle-sunset-02.mp4    # Variant
      bg-garage-night-01.mp4         # Another scene
      prompts.json                   # Prompts used
```

### Fallback (GPU not available)

If no compatible GPU is detected:
1. Log a warning: "LTX-2.3 requires a GPU (NVIDIA CUDA or AMD DirectML)."
2. Fall back to the **image-creator** skill for static slide backgrounds
3. Remotion still creates animated text-based videos without AI footage

## Available operations

- **Text-to-video** — Create a video clip with synchronized audio from text prompt
- **Image-to-video** — Animate a still image into a video clip
- **Audio-to-video** — Generate video driven by an audio input file
- **Generate scene clips** — Parse roteiro and generate clips for each scene
- **Batch generate variants** — Create multiple variants of the same prompt
- **GPU test** — Verify GPU compatibility and VRAM before first render
- **Compose with Remotion** — Hand off clips to Remotion for branding overlay

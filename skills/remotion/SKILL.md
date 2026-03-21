---
name: remotion
description: >
  Creates animated videos from React/TypeScript compositions using Remotion.
  Transforms content scripts and roteiros into MP4 videos with text animations,
  transitions, branded overlays, and background clips. Local rendering via CLI.
description_pt-BR: >
  Cria vídeos animados a partir de composições React/TypeScript usando Remotion.
  Transforma roteiros de conteúdo em vídeos MP4 com animações de texto,
  transições, overlays de marca e clips de fundo. Renderização local via CLI.
description_es: >
  Crea videos animados a partir de composiciones React/TypeScript usando Remotion.
  Transforma guiones de contenido en videos MP4 con animaciones de texto,
  transiciones, overlays de marca y clips de fondo. Renderización local via CLI.
type: local
version: "1.0.0"
categories: [video, automation, content]
---

# Remotion — Video Creator

## When to use

Use this skill when you need to create animated videos from content scripts (Reels, Stories, Shorts, TikTok). It transforms Markdown roteiros into MP4 videos with:
- Text animations (fade, slide, typewriter)
- Scene transitions (crossfade, wipe, zoom)
- Background images/videos
- Branded overlays (logo, watermark, CTA)
- Audio sync (music, voiceover)

## Prerequisites

Ensure these are installed before rendering:

```bash
# Check if Remotion is installed
npx remotion --version

# If not installed, run in the project root:
npm install remotion @remotion/cli @remotion/player @remotion/transitions
npm install react react-dom

# FFmpeg is required for final render
ffmpeg -version
# If missing: winget install FFmpeg (Windows) or brew install ffmpeg (Mac)
```

## Instructions

### Core Workflow

1. **Parse the roteiro** — Read the Markdown script from the squad output. Extract:
   - Scenes (each `## Cena N` or `## Scene N`)
   - Text per scene (headline, body, CTA)
   - Duration per scene (default: 3-5 seconds)
   - Visual direction (colors, mood, background)

2. **Create the Remotion project** — If not yet initialized in the squad output:
   ```bash
   mkdir -p output/video
   cd output/video
   npx remotion init --template blank
   ```

3. **Write the composition** — Create a React component for the video:
   ```tsx
   // src/Video.tsx
   import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';

   export const MyVideo: React.FC = () => {
     return (
       <AbsoluteFill style={{ backgroundColor: '#000' }}>
         <Sequence from={0} durationInFrames={90}>
           <Scene1 />
         </Sequence>
         <Sequence from={90} durationInFrames={90}>
           <Scene2 />
         </Sequence>
       </AbsoluteFill>
     );
   };
   ```

4. **Register the composition** — In `src/Root.tsx`:
   ```tsx
   import { Composition } from 'remotion';
   import { MyVideo } from './Video';

   export const RemotionRoot: React.FC = () => {
     return (
       <Composition
         id="squad-video"
         component={MyVideo}
         durationInFrames={300}
         fps={30}
         width={1080}
         height={1920}
       />
     );
   };
   ```

5. **Preview** (optional) — Open in browser to verify:
   ```bash
   npx remotion studio
   ```

6. **Render** — Export to MP4:
   ```bash
   npx remotion render squad-video output/final-video.mp4
   ```

### Video Presets (width x height x fps)

| Format | Width | Height | FPS | Duration |
|--------|-------|--------|-----|----------|
| Instagram Reel | 1080 | 1920 | 30 | 15-90s |
| Instagram Story | 1080 | 1920 | 30 | 5-15s |
| YouTube Shorts | 1080 | 1920 | 30 | 15-60s |
| TikTok | 1080 | 1920 | 30 | 15-60s |
| YouTube Video | 1920 | 1080 | 30 | 1-10min |
| LinkedIn Video | 1920 | 1080 | 30 | 30-120s |

### Animation Patterns

#### Text Fade In
```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
return <h1 style={{ opacity, fontSize: 64, color: '#fff' }}>Your text</h1>;
```

#### Slide Up
```tsx
const frame = useCurrentFrame();
const translateY = interpolate(frame, [0, 25], [100, 0], { extrapolateRight: 'clamp' });
return <div style={{ transform: `translateY(${translateY}px)` }}>Content</div>;
```

#### Typewriter
```tsx
const frame = useCurrentFrame();
const text = "Your message here";
const charsShown = Math.floor(interpolate(frame, [0, 60], [0, text.length], { extrapolateRight: 'clamp' }));
return <p style={{ fontSize: 48 }}>{text.slice(0, charsShown)}</p>;
```

#### Scene Transition (Crossfade)
```tsx
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <Scene1 />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={90}>
    <Scene2 />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

### Using Background Videos from LTX-2

If the `ltx-video` skill generated background clips, use them:

```tsx
import { Video } from 'remotion';

export const SceneWithBg: React.FC = () => {
  return (
    <AbsoluteFill>
      <Video src="http://localhost:8765/bg-clip-01.mp4" style={{ objectFit: 'cover' }} />
      <AbsoluteFill style={{ background: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: 72, color: '#fff', textAlign: 'center' }}>
          Your overlay text
        </h1>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

### Best Practices

- Keep each scene 3-5 seconds for Reels/Shorts (fast-paced)
- Use bold fonts (700+) at 48px+ for readability on mobile
- Add 15-frame (0.5s) transitions between scenes
- Always include a final CTA scene (follow, like, comment)
- Use the squad's brand colors from `company.md` or agent metadata
- Render at 30fps for social media (60fps wastes file size)
- Add a safe zone margin (10% padding) for Instagram UI overlays
- Test with `npx remotion studio` before final render

### Output Structure

```
output/
  video/
    src/
      Video.tsx         # Main composition
      scenes/
        Scene1.tsx      # Individual scenes
        Scene2.tsx
      assets/
        logo.png        # Brand assets
        bg-clip-01.mp4  # LTX-2 generated clips
    public/
    remotion.config.ts
    final-video.mp4     # Rendered output
```

## Available operations

- **Create video from roteiro** — Parse a Markdown script and create a Remotion composition
- **Render to MP4** — Export the composition to MP4 at target resolution
- **Preview** — Open Remotion Studio for real-time preview in browser
- **Add background clips** — Composite LTX-2 generated clips as video backgrounds
- **Batch render** — Render multiple format variations (Reel, Story, Shorts) from one script

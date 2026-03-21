#!/usr/bin/env node
/**
 * LTX-2.3 Video Generator — ComfyUI API Wrapper
 *
 * Sends a text-to-video workflow to ComfyUI and waits for the result.
 * ComfyUI Desktop must be running on port 8000.
 *
 * Usage:
 *   node skills/ltx-video/scripts/generate.js \
 *     --prompt "A cinematic shot of..." \
 *     --output "squads/my-squad/output/run-id/video/bg-01.mp4" \
 *     [--width 768] [--height 512] [--frames 97] [--steps 20] [--seed 42]
 */

import { readFile, copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMFYUI_URL = 'http://127.0.0.1:8000';
const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 600000; // 10 minutes max

const { values: args } = parseArgs({
  options: {
    prompt:  { type: 'string' },
    output:  { type: 'string' },
    width:   { type: 'string', default: '768' },
    height:  { type: 'string', default: '512' },
    frames:  { type: 'string', default: '97' },
    steps:   { type: 'string', default: '20' },
    seed:    { type: 'string', default: String(Math.floor(Math.random() * 999999999)) },
    workflow:{ type: 'string', default: '' },
  },
  strict: false,
});

if (!args.prompt || !args.output) {
  console.error('Usage: node generate.js --prompt "..." --output "path/to/output.mp4"');
  process.exit(1);
}

async function checkComfyUI() {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadWorkflow() {
  // User can provide a custom workflow JSON exported from ComfyUI
  const workflowPath = args.workflow || join(__dirname, 'workflow-ltx23.json');
  try {
    const raw = await readFile(workflowPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    console.error(`[ERROR] Workflow not found: ${workflowPath}`);
    console.error('Export a workflow from ComfyUI (Save as API format) and place it at:');
    console.error(`  ${join(__dirname, 'workflow-ltx23.json')}`);
    process.exit(1);
  }
}

function injectParams(workflow) {
  // Walk all nodes and replace prompt text, dimensions, seed, steps
  for (const [nodeId, node] of Object.entries(workflow)) {
    const inputs = node.inputs || {};
    const classType = node.class_type || '';

    // Replace prompt text in text-encoding nodes
    if (classType.includes('CLIPTextEncode') || classType.includes('TextEncode')) {
      if ('text' in inputs && typeof inputs.text === 'string') {
        inputs.text = args.prompt;
      }
    }

    // Replace prompt in conditioning nodes
    if ('prompt' in inputs && typeof inputs.prompt === 'string') {
      inputs.prompt = args.prompt;
    }
    if ('text' in inputs && typeof inputs.text === 'string' && classType.toLowerCase().includes('prompt')) {
      inputs.text = args.prompt;
    }

    // Replace dimensions in EmptyLatent or video-generation nodes
    if ('width' in inputs && typeof inputs.width === 'number') {
      inputs.width = parseInt(args.width);
    }
    if ('height' in inputs && typeof inputs.height === 'number') {
      inputs.height = parseInt(args.height);
    }
    if ('num_frames' in inputs) {
      inputs.num_frames = parseInt(args.frames);
    }
    if ('length' in inputs && classType.toLowerCase().includes('video')) {
      inputs.length = parseInt(args.frames);
    }

    // Replace seed
    if ('seed' in inputs && typeof inputs.seed === 'number') {
      inputs.seed = parseInt(args.seed);
    }
    if ('noise_seed' in inputs) {
      inputs.noise_seed = parseInt(args.seed);
    }

    // Replace steps
    if ('steps' in inputs && typeof inputs.steps === 'number') {
      inputs.steps = parseInt(args.steps);
    }
  }

  return workflow;
}

async function queuePrompt(workflow) {
  const body = { prompt: workflow, client_id: 'opensquad-ltx' };
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ComfyUI rejected prompt: ${res.status} — ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  return data.prompt_id;
}

async function waitForCompletion(promptId) {
  const start = Date.now();
  process.stdout.write('  Generating');

  while (Date.now() - start < MAX_WAIT_MS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    process.stdout.write('.');

    const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    if (!res.ok) continue;

    const data = await res.json();
    const entry = data[promptId];
    if (!entry) continue;

    if (entry.status?.completed) {
      console.log(' done!');
      return entry;
    }

    if (entry.status?.status_str === 'error') {
      console.log(' error!');
      throw new Error(`ComfyUI generation failed: ${JSON.stringify(entry.status)}`);
    }
  }

  throw new Error('Timeout: generation took longer than 10 minutes');
}

function findOutputFiles(historyEntry) {
  const files = [];
  const outputs = historyEntry.outputs || {};

  for (const nodeOutput of Object.values(outputs)) {
    // Video outputs
    if (nodeOutput.gifs) {
      for (const gif of nodeOutput.gifs) {
        files.push({ filename: gif.filename, subfolder: gif.subfolder || '', type: gif.type || 'output' });
      }
    }
    // Video outputs (videos key)
    if (nodeOutput.videos) {
      for (const vid of nodeOutput.videos) {
        files.push({ filename: vid.filename, subfolder: vid.subfolder || '', type: vid.type || 'output' });
      }
    }
    // Image outputs (fallback)
    if (nodeOutput.images) {
      for (const img of nodeOutput.images) {
        files.push({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      }
    }
  }

  return files;
}

async function downloadOutput(file, outputPath) {
  const params = new URLSearchParams({
    filename: file.filename,
    subfolder: file.subfolder,
    type: file.type,
  });

  const res = await fetch(`${COMFYUI_URL}/view?${params}`);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);

  await mkdir(dirname(outputPath), { recursive: true });

  const buffer = Buffer.from(await res.arrayBuffer());
  const { writeFile } = await import('node:fs/promises');
  await writeFile(outputPath, buffer);
}

async function main() {
  console.log('  🎬 LTX-2.3 Video Generator');
  console.log(`  Prompt: "${args.prompt.slice(0, 80)}..."`);
  console.log(`  Output: ${args.output}`);
  console.log(`  Settings: ${args.width}x${args.height}, ${args.frames} frames, ${args.steps} steps, seed=${args.seed}`);

  // Check ComfyUI is running
  const alive = await checkComfyUI();
  if (!alive) {
    console.error('\n  [ERROR] ComfyUI is not running on port 8000.');
    console.error('  Open ComfyUI Desktop before running the pipeline.');
    process.exit(1);
  }
  console.log('  ✅ ComfyUI connected');

  // Load and configure workflow
  let workflow = await loadWorkflow();
  workflow = injectParams(workflow);

  // Queue the prompt
  console.log('  📤 Sending to ComfyUI...');
  const promptId = await queuePrompt(workflow);
  console.log(`  Prompt ID: ${promptId}`);

  // Wait for completion
  const result = await waitForCompletion(promptId);

  // Download output
  const files = findOutputFiles(result);
  if (files.length === 0) {
    console.error('  [ERROR] No output files found. Check ComfyUI logs.');
    process.exit(1);
  }

  console.log(`  📥 Downloading ${files.length} file(s)...`);
  for (let i = 0; i < files.length; i++) {
    const outPath = files.length === 1
      ? args.output
      : args.output.replace('.mp4', `-${String(i + 1).padStart(2, '0')}.mp4`);
    await downloadOutput(files[i], outPath);
    console.log(`  ✅ Saved: ${outPath}`);
  }

  console.log('  🎬 Done!');
}

main().catch(err => {
  console.error(`\n  [ERROR] ${err.message}`);
  process.exit(1);
});

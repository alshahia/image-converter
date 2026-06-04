# ONNX model files (Wave 8)

This directory holds the ONNX model files used by the AI tools (background
removal, image upscaling). All files here are served same-origin from
`/models/...` and are NOT loaded from a CDN — Cloudflare Pages sets
`Cross-Origin-Embedder-Policy: require-corp` which blocks cross-origin
resources, and these models are too large to inline.

## Files

| File | Size | Source | License | Used by |
|---|---|---|---|---|
| `briaai-rmbg-1.4.onnx` | ~5 MB | https://huggingface.co/briaai/RMBG-1.4 | MIT | `/bg-removal` (background removal) |
| `realesrgan-x2plus.onnx` | ~10 MB | https://github.com/xinntao/Real-ESRGAN | Apache 2.0 | `/upscale-2x` |
| `realesrgan-x4plus.onnx` | ~40 MB | https://github.com/xinntao/Real-ESRGAN | Apache 2.0 | `/upscale-4x` |

Total: ~55 MB. The full set is requested once, then cached by the browser
and the Cloudflare CDN. `/models/*` is served with `Cache-Control:
public, max-age=31536000, immutable`.

## License requirements

All three models are required to be **MIT or Apache 2.0** — these are the
only two licenses that are both permissive enough to bundle with the
project AND require only attribution (no copyleft). If a different
license is required, raise it before commit.

## Status

These files are **not yet downloaded**. The download + license
verification + attribution placement in `PrivacyPage.tsx` happens in
Wave 8. Until then, the AI tools (`/bg-removal`, `/upscale-2x`,
`/upscale-4x`) are not yet wired up — the routes and ONNX runtime
infrastructure will be in place, but the model files will be missing and
the AI tools will return a "Model not yet downloaded" error.

## Loading strategy

The AI tools load ONNX models lazily on first use, not at app start.
The model file is fetched once, parsed by `onnxruntime-web` (WASM
execution provider, cross-platform), and cached. Subsequent loads come
from the browser cache.

The `onnxruntime-web` package ships its own WASM files in
`node_modules/onnxruntime-web/dist/*.wasm`. These need to be copied
to `/models/ort/` (or bundled into the app) so they can be loaded
same-origin. The exact mechanism is decided in Wave 8.

## Alternative engines considered

- **`@imgly/background-removal`**: uses RMBG-1.4 under the hood, but
  bundles its own model download. We chose to use the model file
  directly via `onnxruntime-web` to keep the model file in this
  directory and avoid a second download path. `@imgly/background-removal`
  is still in `package.json` as a backup if the direct ONNX approach
  has compatibility issues — see AGENTS.md "Known issues for agents".

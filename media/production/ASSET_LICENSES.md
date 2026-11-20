# Video asset provenance

| Material | Origin | License or usage reference |
| --- | --- | --- |
| Skill-YT source, vector artwork, animation and poster | Original project code and programmatic graphics | Repository [MIT license](../../LICENSE) |
| Music bed and gate accents | Original oscillator synthesis in `scripts/audio.mjs` | Repository MIT license |
| Narration | Locally generated Kokoro-82M `af_heart` speech | [Kokoro model card](https://huggingface.co/hexgrad/Kokoro-82M) and [ONNX conversion](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX), both labeled Apache-2.0 |
| Space Grotesk | Fontsource dependency | SIL Open Font License 1.1, preserved in its npm package LICENSE |
| IBM Plex Mono | Fontsource dependency | SIL Open Font License 1.1, preserved in its npm package LICENSE |
| Remotion framework | Official pinned npm packages | [Remotion license and terms](https://www.remotion.dev/docs/license) |

Framework and dependency licenses apply separately from the project MIT license. Check Remotion's current eligibility and terms for the intended rendering use. Model weights and font binaries are restored through their upstream dependencies. The proposed editable archive carries the exact original narration WAVs and font license notices. It excludes model weights and installed dependency binaries.

The production uses original vector graphics and synthesized audio. It includes no commercial soundtrack, stock footage, mailbox recordings or user-supplied private messages. Preserve the project license and these provenance notices with redistributed source assets.

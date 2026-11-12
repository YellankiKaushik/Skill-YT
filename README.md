# Skill-YT

`video-to-project-skill` turns technical tutorials, transcripts, and walkthroughs into reusable Codex skills. It checks the target repository's instructions, dependencies, and test commands before adapting the workflow. The canonical source is [skills/video-to-project-skill](skills/video-to-project-skill/SKILL.md).

## Install

Use Node.js 20 or newer. The installer uses built-in modules.

```sh
git clone https://github.com/YellankiKaushik/Skill-YT.git
cd Skill-YT
node scripts/install_video_to_project_skill.mjs --user --dry-run
node scripts/install_video_to_project_skill.mjs --user
```

The global installation goes to `~/.agents/skills/video-to-project-skill`. For project scope, run the following from the Skill-YT clone with your existing project's path.

```powershell
node scripts/install_video_to_project_skill.mjs --project "C:\Projects\my-app" --dry-run
node scripts/install_video_to_project_skill.mjs --project "C:\Projects\my-app"
```

The installer uses the project's `.agents/skills` directory and refuses to replace an existing copy. You can also copy the entire canonical skill directory into either location manually. Restart Codex if the skill does not appear.

## Use in Codex

Open Codex in the target repository and attach a transcript or paste the relevant source material.

```text
$video-to-project-skill
Use the attached transcript to create a project skill for the demonstrated test
workflow. Read AGENTS.md, use the repository's package scripts, cite the source
timestamps, and verify the generated skill.
```

```text
$video-to-project-skill
Turn the migration steps in these notes into a reusable project skill. Check the
repository's migration tooling and exercise validation in a disposable project.
```

The [source and verification guide](docs/VIDEO_TO_PROJECT_SKILL.md) includes a timestamped example from the original YouTube transcript and explains how to supply evidence for other tutorials.

## Validate

```sh
node scripts/validate_video_to_project_skill.mjs
node --test tests/video_to_project_skill.test.mjs
```

See the [Agent Skills specification](https://agentskills.io/specification) and [Codex skills documentation](https://learn.chatgpt.com/docs/build-skills).

## License

[MIT](LICENSE)

Search indexed PixelLab docs → extract technical specs → propose amendments to fill gaps in this game art plan.

<input>
- Document: {doc_path}
- Project: {project}
- Resources: PixelLab API docs, pixel art guides
</input>

<output>
- Facts: technical specs, best practices, validation, pitfalls (with citations)
- Proposals: amendments that make the document informed and correct
</output>

<commands>
Search:   m chunks "{query}" --project {project}
Dedupe:   m similar "{text}" --type fact
Add fact: m add fact --content "{content}" --source {resource_id} --citation "{citation}" --doc {doc_path}
Propose:  m add proposal --title "{title}" --target {doc_path} --amendment "{amendment}" --facts {fact_ids}
</commands>

<gaps_to_fill>
1. PixelLab API parameters (size, n_directions, view, detail, shading)
2. Animation template frame counts and timing
3. ZIP output structure, metadata.json schema
4. Open Questions (4 vs 8 directions, flying animations, attack animations)
5. Validate existing choices (64px size, 4 directions, frame counts) against best practices
6. Sprite conversion pitfalls to avoid
7. Surprises: anything that contradicts, invalidates, or significantly changes plan assumptions
</gaps_to_fill>

<examples>
Good fact: "breathing-idle template: 6 frames, 100ms per frame"
Good fact: "4-direction sprites work well for side-view games; 8 only needed for large detailed sprites"
Good fact: "common pitfall: forgetting to set Nearest filtering causes blurry upscaling"
Good fact: "SURPRISE: side view characters need different proportions than top-down" (contradicts plan assumption)
Bad fact:  "PixelLab creates high-quality sprites" (no concrete value)
Bad fact:  "animations are smooth" (subjective)

Good proposal:
  title: "Add frame counts to Phase 4 Animation Mapping"
  amendment: "Add row: | breathing-idle | 6 frames | 100ms/frame |"

Good proposal:
  title: "Validate 64px choice in Phase 2"
  amendment: "Add note: 64px is appropriate for this game's scale (PixelLab supports 16-128px)"

Bad proposal:
  title: "Improve animation section"
  amendment: "Add more details about animations" (vague)
</examples>

<constraints>
- Facts must be concrete: values, formats, validated practices, or specific pitfalls
- Skip facts already stated in document
- Skip marketing copy and subjective descriptions
- Dedupe before creating: skip if m similar returns score > 0.65
- Proposals must specify exact insertion point
</constraints>

<stop>
- 5+ proposals created, OR
- 2 consecutive searches return no new facts, OR
- All 7 gap areas addressed
</stop>

<document>
{doc_content}
</document>

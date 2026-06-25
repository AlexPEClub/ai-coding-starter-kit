# EP01 — "I Let Claude Build a GMP Qualification Package in 10 Minutes"

**Pillar:** 1 — AI for GMP (flagship) · **Channel:** Kordix AI · **Target length:** 9–10 min
**Primary keyword:** *AI for computerized system validation (CSV)* · **Secondary:** *GAMP 5 documentation, IQ OQ PQ automation, Claude for pharma*
**Goal:** Subscribers + email list (lead magnet) + Claude affiliate clicks + funnel into GMP Starter Pack (€39).

---

## 0. Strategic Brief & Research

**Audience:** GMP/CSV professionals, validation engineers, QA, CSV consultants, pharma project managers. Skeptical, regulated, time-poor, allergic to hype. They will *instantly* dismiss anyone who suggests "AI replaces validation."

**Search intent we serve:** "Can I use AI / ChatGPT / Claude for CSV documentation?", "automate IQ OQ PQ", "GAMP 5 template generator", "reduce validation documentation effort".

**The angle that wins this audience:** *AI kills the blank page, not the validation.* We show a real, GAMP-shaped package being drafted in minutes, then we **deliberately catch the AI's mistakes on camera** and fix them as an SME. The honesty is the hook — it's what separates Kordix from generic "AI will do your job" content and it's what makes a Quality professional hit subscribe.

**Demo artifact:** A full qualification document set for a **GxP Environmental Monitoring System (EMS)** on a cold-storage unit — a GAMP 5 **Category 4 (configured product)**, data-integrity-critical (Part 11 / Annex 11), qualification-heavy. Concrete, universally relatable in pharma.

**Package the demo generates (8 documents):**
1. Validation Plan (VP)
2. User Requirements Specification (URS)
3. Functional Risk Assessment (FRA / FMEA) + GAMP categorisation
4. Installation Qualification (IQ) protocol
5. Operational Qualification (OQ) protocol
6. Performance Qualification (PQ) protocol
7. Requirements Traceability Matrix (RTM)
8. Validation Summary Report (VSR) skeleton

> **Tooling honesty note for the host:** the on-screen build uses Claude (Claude Code / Projects) driven by a structured prompt library — a reusable "skill" that encodes GAMP 5 structure, ALCOA+ and Part 11 expectations. We sell the *system*, not a one-off magic trick.

---

## 1. SCRIPT (with on-screen direction)

> Format: **[V]** = visual / on-screen · **[T]** = text overlay · spoken lines in plain text. ~1,500 words, calm-confident male VO. Total ≈ 9:30.

### HOOK — 0:00–0:22
**[V]** Cold open on a screen recording: an empty Word/Markdown doc titled *Validation Plan*, cursor blinking. Then a hard cut to the same doc, full.
**[T]** "3 weeks → 10 minutes"

This validation package normally eats three weeks of my life. I just generated the first draft in under ten minutes.
And before every CSV person watching closes the tab — no, this will **not** get you an FDA 483.
Because the AI didn't replace the validation. It replaced the *blank page*. Let me show you exactly how — document by document — using Claude.

**[V]** Kordix AI logo sting (hexagon crystal, cyan→violet), title card: *"Can AI Build a GMP Qualification Package?"*

### PROBLEM — 0:22–1:35
**[V]** B-roll: stacks of binders, a V-model diagram drawing itself, a clock spinning.

If you've ever validated a computerized system, you know the real work isn't the thinking. It's the *typing*.
The Validation Plan. The URS. The risk assessment. IQ, OQ, PQ protocols — each with dozens of test steps. The traceability matrix that has to tie every requirement to every test. And the summary report at the end.
**[T]** VP · URS · FRA · IQ · OQ · PQ · RTM · VSR

GAMP 5 Second Edition literally asks us to think more critically and document *less* for the sake of documenting. But in the real world? You're still copy-pasting from last project's templates, renumbering requirements at midnight, and praying the traceability matrix actually traces.
That blank page — that "set up the whole document structure from scratch" tax — is where validation projects quietly bleed time.
So I asked a simple question: what if I let Claude do the *structure and the first draft*, and I stay the SME who reviews, challenges, and approves?

### SOLUTION — 1:35–2:35
**[V]** Simple animated diagram: [ SME inputs ] → [ Claude + GAMP 5 Skill ] → [ Draft package ] → [ SME review & approve ] → [ Effective docs ]. Human icon highlighted at both ends.

Here's the setup, and the honesty matters. I'm not pasting "write me a validation plan" into a chatbot.
I built Claude a **skill** — a reusable instruction set that knows the GAMP 5 document structure, the ALCOA+ data-integrity principles, and what 21 CFR Part 11 and EU Annex 11 actually expect.
**[T]** GAMP 5 · ALCOA+ · 21 CFR Part 11 · Annex 11
I give Claude the system context. Claude gives me a structured, consistent first draft. And then — this is the non-negotiable part — *I* do the validation: I review every requirement, I own every risk rating, I approve. The human stays in the loop, start to finish. That's not a disclaimer. That's the design.

### DEMO — 2:35–7:35 (the core)
**[V]** Full screen-capture, picture-in-picture host in corner. Each step gets a numbered chapter chip top-right.

**Step 1 — Context (2:35–3:10).** **[T]** ① Define the system
I tell Claude what we're validating: an Environmental Monitoring System on a cold-storage unit, GxP-critical, stores temperature data used for batch release. I give it the GAMP category I expect — Category 4, configured product — and the regulatory scope.
Watch what it does first: it doesn't dive into protocols. It asks me clarifying questions — operating range, number of probes, who the data owner is. Good. That's exactly the conversation a validation lead should be having.

**Step 2 — Validation Plan (3:10–3:45).** **[T]** ② Validation Plan
Thirty seconds. It drafts a Validation Plan: scope, the V-model deliverables, roles and responsibilities, the risk-based approach, acceptance criteria, and a deviation-handling section.
**[V]** Highlight the "Roles & Responsibilities" and "Risk-Based Approach" sections.
Is it perfect? No. It assumed a validation team of five. I'm a department of *one* on this. Two-second fix. But the bones — the structure I'd normally spend half a day formatting — are already here.

**Step 3 — URS (3:45–4:35).** **[T]** ③ User Requirements
Now the User Requirements Specification. This is where AI genuinely shines, because good requirements are *structured, atomic, and testable* — and that's a format problem as much as a knowledge problem.
**[V]** Scroll a table: ID, Requirement, Category (Regulatory / Functional / Data Integrity), Priority, GAMP ref.
Look — uniquely numbered, each requirement testable, tagged for data integrity. URS-DI-014: "All temperature records shall be attributable, time-stamped, and protected from unauthorized modification." That's ALCOA+ baked straight into a requirement. It even flagged audit-trail review as its own requirement, which teams forget constantly.

**Step 4 — Risk Assessment (4:35–5:25).** **[T]** ④ Functional Risk Assessment
This is the step that *requires* a human, and I want to show you why. I ask for a functional risk assessment — an FMEA. Claude produces failure modes, severity, probability, detectability, and a risk priority.
**[V]** Zoom on one row, then circle a rating.
And here's a mistake — on purpose, I left it in. It rated the probe-failure detectability as "high" because it assumed a continuous alarm. *This* system polls every fifteen minutes. That changes the risk. I override it. **[T]** ⚠ SME override
That's the whole point. The AI gives you a fast, complete first pass at the risk table. *You* bring the system knowledge that makes the rating correct. Skip that and yes — *that's* how you earn a 483.

**Step 5 — IQ / OQ / PQ (5:25–6:40).** **[T]** ⑤ IQ · OQ · PQ protocols
Now the protocols. IQ: hardware, software version, installation environment, utilities, document verification — each as an executable test step with expected result and a pass/fail field.
OQ: the functional tests — does the high/low temperature alarm fire at the configured limits, is the audit trail capturing changes, do user-access levels enforce Part 11 controls.
PQ: the system performing under real GxP conditions over time — a mapping study, sustained data capture, recovery after a power loss.
**[V]** Fast montage of the three protocols scrolling, test-step tables visible.
Every step is pre-numbered and traceable. The thing that normally makes me want to quit validation — writing two hundred individual test steps — is drafted. I still execute and witness every one. But I'm not *inventing* them from a blank page.

**Step 6 — Traceability Matrix (6:40–7:15).** **[T]** ⑥ Traceability Matrix
And the payoff. The Requirements Traceability Matrix — every URS requirement mapped to the protocol and test step that proves it.
**[V]** The RTM table, requirements on the left, test IDs on the right, no gaps.
This is the document everyone hates building by hand and auditors love to find holes in. Because Claude generated the requirements and the tests in the same structured pass, the trace is *consistent by construction*. I verify it — I don't assemble it.

**Step 7 — Reality check (7:15–7:35).**
**[V]** Host on camera, screen behind.
So — ten minutes, eight documents, one coherent package. Let me tell you honestly what's *not* done.

### RESULTS — 7:35–8:40
**[V]** Split screen: left "What AI did" / right "What I still own".

What the AI did: structure, formatting, complete first-draft content, internal consistency, and a traceability matrix with no gaps. The 80% that is mechanical.
**[T]** AI: structure · first draft · consistency · traceability
What I still own — and always will: every risk rating, the system-specific knowledge, the GxP judgment, the execution and witnessing of every test, and the approval signature. The 20% that is actually validation.
**[T]** SME: risk · judgment · execution · approval
Is this draft audit-ready as-is? Absolutely not, and anyone who tells you otherwise is selling you a 483. Is it a three-week head start compressed into an afternoon of *review instead of authoring*? Every single time.
That's the shift: AI doesn't make you less of a validation expert. It moves your time from typing to thinking — which is exactly where GAMP 5 wanted it all along.

### CTA — 8:40–9:30
**[V]** End card: lead-magnet mockup left, subscribe button pulse, "Next video" thumbnail right.

I packaged the URS template and the CSV readiness checklist I used here — free. Link in the description; it's the fastest way to try this on your own system today.
**[T]** ⬇ Free: URS Template + CSV Checklist
If you want the full prompt library — the skill that makes Claude actually *think* in GAMP — that's in the Kordix AI GMP Starter Pack, also linked below.
Subscribe if you want AI that respects how regulated work actually gets done. And watch this one next — I put Claude up against a real Annex 11 audit-trail review.
Kordix AI. Build smarter. Validate faster. See you in the next one.

---

## 2. STORYBOARD (timestamp-by-timestamp)

| Time | Scene | On-screen / B-roll | Text overlay | Transition |
|------|-------|--------------------|--------------|------------|
| 0:00 | Hook | Blinking-cursor empty doc → cut to full doc | `3 WEEKS → 10 MINUTES` | Hard cut |
| 0:12 | Hook turn | "no 483" — red 483 stamp dissolves | `NOT A SHORTCUT` | Stamp wipe |
| 0:18 | Logo sting | Hexagon crystal forms, cyan→violet | `KORDIX AI` | Glow build |
| 0:22 | Problem | Binders, V-model self-draws, clock spins | `VP·URS·FRA·IQ·OQ·PQ·RTM·VSR` | Whip pan |
| 1:35 | Solution | Pipeline diagram, human icons glow at both ends | `GAMP 5 · ALCOA+ · PART 11 · ANNEX 11` | Slide |
| 2:35 | Demo ① | Screen-cap, host PiP, chapter chip ① | `① DEFINE THE SYSTEM` | Zoom-in |
| 3:10 | Demo ② | VP draft scroll, sections highlight | `② VALIDATION PLAN` | Push |
| 3:45 | Demo ③ | URS table scroll, DI rows glow | `③ USER REQUIREMENTS` | Push |
| 4:35 | Demo ④ | FMEA table, circle a rating, override flash | `④ RISK · ⚠ SME OVERRIDE` | Shake/zoom |
| 5:25 | Demo ⑤ | IQ/OQ/PQ montage, step tables | `⑤ IQ · OQ · PQ` | Fast cuts |
| 6:40 | Demo ⑥ | RTM table, left-to-right trace lines draw | `⑥ TRACEABILITY` | Line-draw |
| 7:15 | Reality | Host on camera, screen behind | — | Cut to cam |
| 7:35 | Results | Split: AI did / SME owns | `AI · SME` columns | Split slide |
| 8:40 | CTA | End card: lead magnet + subscribe + next | `⬇ FREE TEMPLATE` | Pulse |
| 9:30 | Outro | Logo + tagline lockup | `BUILD SMARTER. VALIDATE FASTER.` | Fade |

---

## 3. VOICEOVER SCRIPT (ElevenLabs-ready)

**Voice profile:** Male, professional, calm, confident. Model: ElevenLabs Multilingual v2 or Turbo v2.5. **Stability** 45–55 · **Similarity** 75 · **Style** 10–20 · Speaker boost ON. Target pace ~145 wpm.

**Pronunciation / SSML guidance (pre-process these so ElevenLabs says them right):**
- "GAMP" → say as one word, *gamp* (rhymes with *camp*). Write as `GAMP`.
- "GxP" → "G-x-P" (letters). "CSV" → "C-S-V" (letters — this is *Computerized System Validation*, not a spreadsheet).
- "URS" → "U-R-S". "IQ / OQ / PQ" → "I-Q", "O-Q", "P-Q". "RTM" → "R-T-M". "VSR" → "V-S-R". "FMEA" → "F-M-E-A".
- "ALCOA+" → "AL-co-a plus". "Annex 11" → "annex eleven". "21 CFR Part 11" → "twenty-one C-F-R part eleven". "483" → "four eighty-three".
- Insert short pauses with `...` or `<break time="350ms"/>` at the em-dashes for emphasis.

**Clean VO copy (no visual cues — paste this block):**

> This validation package normally eats three weeks of my life. I just generated the first draft in under ten minutes. <break time="300ms"/> And before every CSV person watching closes the tab — no, this will not get you an FDA four eighty-three. Because the AI didn't replace the validation. It replaced the blank page. Let me show you exactly how, document by document, using Claude.
>
> If you've ever validated a computerized system, you know the real work isn't the thinking. It's the typing. The Validation Plan. The U-R-S. The risk assessment. I-Q, O-Q, P-Q protocols, each with dozens of test steps. The traceability matrix that has to tie every requirement to every test. And the summary report at the end. <break time="250ms"/> GAMP five, second edition, literally asks us to think more critically and document less for the sake of documenting. But in the real world? You're still copy-pasting last project's templates and renumbering requirements at midnight. That blank page is where validation projects quietly bleed time. So I asked a simple question: what if I let Claude do the structure and the first draft, and I stay the S-M-E who reviews, challenges, and approves?
>
> Here's the setup, and the honesty matters. I'm not pasting "write me a validation plan" into a chatbot. I built Claude a skill — a reusable instruction set that knows the GAMP five document structure, the AL-co-a plus data-integrity principles, and what twenty-one C-F-R part eleven and E-U annex eleven actually expect. I give Claude the system context. Claude gives me a structured first draft. And then — the non-negotiable part — I do the validation. I review every requirement, I own every risk rating, I approve. The human stays in the loop, start to finish. That's not a disclaimer. That's the design.
>
> [DEMO — see script §1 steps 1–6; record VO per step against screen capture.]
>
> So — ten minutes, eight documents, one coherent package. Let me tell you honestly what's not done. What the AI did: structure, formatting, complete first-draft content, internal consistency, and a traceability matrix with no gaps. The eighty percent that is mechanical. What I still own, and always will: every risk rating, the system-specific knowledge, the GxP judgment, the execution and witnessing of every test, and the approval signature. The twenty percent that is actually validation. <break time="300ms"/> Is this draft audit-ready as-is? Absolutely not. Is it a three-week head start compressed into an afternoon of review instead of authoring? Every single time. AI doesn't make you less of a validation expert. It moves your time from typing to thinking — which is exactly where GAMP five wanted it all along.
>
> I packaged the U-R-S template and the CSV readiness checklist I used here — free. Link in the description. If you want the full prompt library, the skill that makes Claude actually think in GAMP, that's in the Kordix AI GMP Starter Pack below. Subscribe if you want AI that respects how regulated work actually gets done. Kordix AI. Build smarter. Validate faster. See you in the next one.

---

## 4. B-ROLL PLAN

> **✅ Produced this session (faceless POC)** — in `assets/EP01/`:
> - **`EP01-intro-clip-hero-5s.mp4`** — 5s cinematic image-to-video (Higgsfield Cinema Studio) animating the hero crystal: slow push-in, light refraction. Channel intro / hook visual. Silent (audio added in edit).
> - **`EP01-hook-voiceover-sterling-16s.mp3`** — 16s ElevenLabs VO (voice *Sterling*, male/professional) of the EP01 hook. Lay over b-roll in CapCut.
> - **Next:** generate 2–3 more b-roll clips to cover the 16s VO, then assemble into the full hook scene (no ffmpeg in this env → assemble via CapCut or Adobe quick-cut).

| # | Shot | Source | Use |
|---|------|--------|-----|
| 1 | Blinking cursor on empty "Validation Plan" doc | Screen capture | Hook |
| 2 | Red "483" stamp | Canva/Higgsfield, transparent PNG | Hook turn |
| 3 | V-model diagram self-drawing | Animated (After Effects / Canva) | Problem |
| 4 | Binders / document stacks, slow push-in | Higgsfield image→video | Problem |
| 5 | Clock hands spinning fast | Stock / Higgsfield | "bleed time" |
| 6 | Pipeline diagram (SME→Claude→draft→SME) | Canva animated | Solution |
| 7 | Full demo screen capture (the build) | OBS / ScreenStudio, 60fps, clean desktop | Demo ①–⑥ |
| 8 | Macro probe / cold-storage unit, blue light | Higgsfield / stock | EMS context |
| 9 | Split-screen lower-third "AI / SME" | Canva | Results |
| 10 | End-card lead-magnet mockup (tablet showing checklist) | Higgsfield / Canva | CTA |

**Screen-capture hygiene:** clean desktop, hide personal data, Sora-rendered docs if possible, 1080p+ source, zoom to 125% so text is legible on mobile. Pre-build the EMS example package so each step *reveals* cleanly on cut.

---

## 5. HIGGSFIELD PROMPTS (brand-locked)

> Global style suffix to append to every prompt: `— dark premium, deep navy #070B1E background, cyan-to-violet gradient accents (#38E5FF → #0078FF → #7B81FF → #A720FF), subtle volumetric glow, clean geometric, high detail, cinematic, 16:9, no text, no watermark.`
>
> **✅ Hero generated this session** (Recraft 4.1, 2688×1536) — `assets/EP01/EP01-hero-crystal-A.png` (+ `-B`): glowing crystal over a hexagonal grid in cyan→violet — on-brand with the Kordix logo motif. Reuse as title-card background, intro sting frame, and section dividers.

1. **Title/hero (16:9):** "A glowing 3D crystalline icosahedron hovering above a hexagonal network grid, refracting cyan and violet light, floating in dark space, premium tech aesthetic."
2. **Problem — document burden:** "Towering stacks of identical bureaucratic binders fading into darkness, a single thin beam of blue light cutting across, oppressive scale, cinematic depth."
3. **Time bleed:** "Macro shot of a sleek analog clock, hands motion-blurred from spinning, dissolving into blue particles, dark background, melancholic premium mood."
4. **EMS context:** "Extreme close-up of a temperature sensor probe inside a pharmaceutical cold-storage unit, frost on stainless steel, soft blue interior lighting, shallow depth of field."
5. **Human-in-the-loop:** "Silhouette of a professional at a desk reviewing a holographic document interface, cyan-violet UI panels floating, focused and calm, dark studio."
6. **Risk override moment:** "An abstract glowing data table where one cell pulses warning-amber against blue rows, a hand-cursor selecting it, dramatic spotlight, dark UI aesthetic."
7. **Traceability matrix:** "An elegant network of thin glowing lines connecting two columns of nodes left to right, cyan flowing into violet, forming a clean lattice, dark premium data-viz."
8. **End-card device:** "A modern tablet on a dark surface displaying a crisp checklist UI with blue accent checkmarks, soft rim light, product-shot quality."
9. **Outro lockup bg:** "Minimal dark gradient backdrop, faint hexagonal mesh, soft cyan-violet vignette, empty centre for logo placement."

*(Run via `generate_image` → image→video with `generate_video` for the moving shots; upscale hero with `upscale_image`.)*

---

## 6. CANVA ASSETS (build list)

| Asset | Spec | Notes |
|-------|------|-------|
| Title card | 1920×1080 | "CAN AI BUILD A GMP QUALIFICATION PACKAGE?" Sora uppercase, gradient underline |
| Lower-third (host) | 1920×1080 safe area | Name + "Kordix AI · CSV" |
| Chapter chips ①–⑥ | 400×400 PNG, transparent | Numbered, cyan ring, top-right |
| V-model diagram | 1920×1080 | URS→FS→Config on left arm, IQ/OQ/PQ on right, animate draw-on |
| Pipeline diagram | 1920×1080 | SME → Claude+Skill → Draft → SME → Effective; glow human icons |
| "3 WEEKS → 10 MIN" stat | 1080×1080 + 1920×1080 | Big number, gradient, reusable on Shorts |
| ALCOA+ checklist graphic | 1080×1350 | 9 principles, blue checkmarks — also a standalone carousel asset |
| Results split panel | 1920×1080 | Two columns: "AI DID" / "SME OWNS" |
| End card | 1920×1080 | Lead magnet mockup + subscribe + next-video slot |
| Thumbnail (3 variants) | 1280×720 | See §7 |
| Brand kit | — | Lock palette + Sora into a Canva Brand Kit for every future episode |

---

## 7. THUMBNAIL CONCEPTS (3 to A/B test)

> **✅ Generated this session** (Recraft 4.1, brand palette locked, 2688×1536) — see `assets/EP01/`:
> - **`EP01-thumbnail-A-recommended.png`** — Concept B executed: bold "3 WEEKS → 10 MIN" left, glowing book/binder stack right, cyan→violet gradient. Punchy, mobile-legible, **text rendered correctly** → recommended primary.
> - **`EP01-thumbnail-B.png`** — same line, horizontal minimal layout, darker. Use as the A/B challenger.
> - Both are **faceless** (correct for the channel). The face-based concepts below stay as options only if a host face is added later.
> - **Final step in Canva:** drop the real **Sora** font over the text layer for brand consistency and set 1280×720 export. The AI text is a strong base, not the final type.
>
> **✅ Editable Canva design created** (`youtube_thumbnail`, 1280×720, real text layers, brand colours):
> - **Edit:** https://www.canva.com/d/RXSbiR_50QEx4QP — **View:** https://www.canva.com/d/wfpq_UC4qCfkKeN (design id `DAHNkpFdTtA`)
> - 3 alternative AI candidates from the same prompt: https://www.canva.com/d/65ZoXrPY66-zjzm · https://www.canva.com/d/3ERmJnoel67FJdR · https://www.canva.com/d/s-iw1i_Vw2w_fNR
> - **To finalise (in the Canva editor — the API can't set font family):** select the headline → Font → **Sora** (Bold) → optionally Replace the binder image with `assets/EP01/EP01-thumbnail-A-recommended.png` → **Share ▸ Save as brand template** so every future episode reuses this layout.
> - Export at **1280×720 PNG** (done once via API; re-export after the Sora swap).

**Concept A — "The Stamp" (recommended).**
Left: founder's face, slightly skeptical/intrigued expression, lit blue. Right big text **"CLAUDE BUILT THIS?"** in Sora. A red **"483?"** stamp half-overlapping. Bottom strip: faint document/RTM grid glowing cyan→violet. High contrast, mobile-legible at 3 words.

**Concept B — "3 Weeks → 10 Min".**
Center: huge **"3 WEEKS → 10 MIN"** with the arrow in the signature gradient. Background: dimmed stack of validation docs. Small Kordix crystal logo top-left. Pure curiosity/stat play — strong for browse traffic.

**Concept C — "Human in the loop".**
Split: left a glowing AI document, right a human hand with a red pen marking it. Text **"AI WRITES. YOU APPROVE."** Speaks directly to the QA mindset; lower CTR but higher-quality clicks. Good as the *retarget* thumbnail if A plateaus.

**Rules:** ≤4 words, faces test best for this niche, never put "GMP/CSV/GAMP" tiny — put the *emotion* big and the jargon in the title. Test A vs B first.

---

## 8. SEO PACKAGE

**Primary title (A/B):**
- A: `I Let Claude Build a GMP Qualification Package in 10 Minutes`
- B: `AI Wrote My CSV Validation Package in 10 Minutes (IQ/OQ/PQ)`

**Alternative titles:**
- `Can AI Replace CSV Documentation? I Tested Claude on a Real GAMP 5 Package`
- `Claude vs. 3 Weeks of Validation Paperwork (Honest Test)`
- `How I Draft IQ/OQ/PQ Protocols 10x Faster with AI (Without a 483)`
- `GAMP 5 Documentation with AI: What Works, What Will Get You Audited`

**Description:**
```
I gave Claude a real GMP computerized-system-validation task — a full qualification
package for an Environmental Monitoring System — and drafted all 8 documents
(Validation Plan, URS, Risk Assessment, IQ, OQ, PQ, Traceability Matrix, Summary
Report) in about 10 minutes. Then I show you, honestly, what an AI gets right and
exactly where a qualified SME has to take over. AI kills the blank page — it does
NOT replace validation.

⬇️ FREE: URS Template + CSV Readiness Checklist → [LINK]
📦 Kordix AI GMP Starter Pack (the full prompt library / skill) → [LINK]
🤖 Try Claude (affiliate) → [LINK]

⏱️ Chapters
00:00 The 3-weeks-in-10-minutes claim
00:22 Why CSV documentation eats your time
01:35 The setup: Claude + a GAMP 5 skill (human-in-the-loop)
02:35 ① Defining the system
03:10 ② Validation Plan
03:45 ③ User Requirements (URS)
04:35 ④ Risk Assessment — where the SME MUST override
05:25 ⑤ IQ / OQ / PQ protocols
06:40 ⑥ Traceability Matrix
07:35 What AI did vs. what you still own
08:40 Free template + what's next

Kordix AI — AI for Pharma Professionals. Build smarter. Validate faster.

⚠️ Not regulatory advice. AI output is a draft; qualified SME review, execution,
and approval remain mandatory under GAMP 5, 21 CFR Part 11 and EU Annex 11.

#CSV #GAMP5 #PharmaValidation #AIforPharma #ClaudeAI #DataIntegrity #GMP
```

**Tags / keywords:** computerized system validation, CSV pharma, GAMP 5, GAMP 5 second edition, IQ OQ PQ, validation documentation, URS template, 21 CFR Part 11, EU Annex 11, ALCOA+, data integrity, AI for pharma, Claude AI tutorial, AI validation, FMEA risk assessment, qualification package, pharma QA, FDA 483, Kordix AI.

**Hashtags (social):** #AIforPharma #CSV #GAMP5 #PharmaValidation #DataIntegrity #ClaudeAI #GMP #QualityAssurance #Pharma4_0 #ValidationEngineer

**Pinned comment:** "Honest question for the QA folks: where's the line for you — would you let AI draft the URS and risk assessment, or is even the first draft off-limits in your QMS? 👇 (Free URS template + checklist in the description.)"

---

## 9. AFFILIATE PLACEMENTS

| Placement | Where | Copy / CTA |
|-----------|-------|------------|
| Primary — Claude | Description line 2 + verbal at 1:35 ("I built Claude a skill") | "Try Claude → [aff link]" |
| Secondary — Notion | If RTM/URS shown exported to Notion | "I track the whole package in Notion → [aff]" |
| Tertiary — ElevenLabs / CapCut | Description "How this video was made" block | "Voiceover: ElevenLabs · Edited in CapCut" |
| Soft — own product | Verbal CTA 8:40 + end card | GMP Starter Pack €39 (owned, highest margin) |

**Rules:** one *primary* affiliate, mentioned naturally where it's actually used; never stack 6 links. Owned product > affiliate in priority. Disclose ("affiliate") in description per FTC/ASA.

---

## 10. TIKTOK / REELS VERSIONS (9:16, 30–45s)

**TT-1 — "The 483 hook"**
> (0–3s, big text "AI wrote my validation package?") I let Claude draft a full GMP qualification package — Validation Plan, URS, IQ, OQ, PQ — in ten minutes. (cut to RTM) And no, it won't get you an FDA 483 — *if* you do this one thing: the AI drafts, you stay the SME who owns every risk rating and approves. It kills the blank page. It doesn't replace your judgment. Full breakdown on YouTube — free URS template in bio.

**TT-2 — "Where AI fails (and that's good)"**
> Everyone shows AI succeeding. Here's where I *made it fail* on purpose. (FMEA row zoom) It rated this probe-failure risk wrong because it didn't know our system only polls every 15 minutes. A human catches that in two seconds. That's the whole job now — you're not typing the risk table, you're correcting it. AI for CSV, done honestly. Follow for more.

**TT-3 — "3 weeks → 10 minutes"**
> This stack of validation documents is three weeks of work. (swipe) I just drafted it in ten minutes with Claude. URS, risk assessment, IQ/OQ/PQ, traceability matrix — all structured, all consistent. I still execute and approve everything — but I'll never start from a blank page again. Free template in bio.

---

## 11. YOUTUBE SHORTS VERSIONS (9:16, <60s)

**Short-1 (repurpose TT-1)** — vertical crop of the hook + RTM reveal, end card "Full video ↗". CTA: subscribe.
**Short-2 — "ALCOA+ in one requirement":** Show URS-DI-014 and explain how one well-written requirement encodes Attributable / Legible / Contemporaneous / Original / Accurate. Pure value, no pitch. Great for niche authority.
**Short-3 — "The one step you can't automate":** the risk-assessment override moment. Hook: "This is the part of validation AI can't do — and it's the part that matters."

---

## 12. LINKEDIN POST

> I let Claude draft a full GMP qualification package in 10 minutes.
>
> Validation Plan. URS. Risk assessment. IQ, OQ, PQ. Traceability matrix. The whole set for an Environmental Monitoring System — drafted before my coffee got cold.
>
> Here's the part the AI-hype crowd skips:
>
> It got the *structure* and the *first draft* right — uniquely numbered requirements, ALCOA+ baked into the data-integrity specs, a traceability matrix that's consistent by construction.
>
> And it got a risk rating *wrong* — because it didn't know our system only polls every 15 minutes. I overrode it in two seconds.
>
> That's exactly the point.
>
> → AI eliminates the blank-page tax: ~80% of validation work that is mechanical formatting and drafting.
> → The SME still owns 100% of the judgment: risk ratings, GxP context, execution, approval.
>
> GAMP 5 (2nd ed.) asked us to spend less time documenting and more time thinking critically. Used honestly — human firmly in the loop — AI is the first tool that actually delivers that.
>
> It won't get you a 483. Skipping the review will.
>
> I broke down the full build (and where I made it fail on purpose) on the Kordix AI channel — link in comments. Free URS template + CSV readiness checklist in there too.
>
> Quality folks: would you let AI draft your URS and risk assessment — or is the first draft off-limits in your QMS? Genuinely curious. 👇
>
> #CSV #GAMP5 #PharmaValidation #DataIntegrity #AIforPharma #GMP

*(First comment: YouTube link + lead-magnet link — keeps the post in-platform for reach.)*

---

## 13. NEWSLETTER DRAFT

**Subject lines (A/B):**
- A: `I let Claude write a validation package in 10 minutes (here's where it broke)`
- B: `The honest test: AI vs. 3 weeks of CSV paperwork`

**Preview text:** `AI kills the blank page — not the validation. Plus a free URS template.`

**Body:**
> Hey {{first_name}},
>
> This week I did something that would make some QA managers nervous: I handed Claude a real GMP computerized-system-validation job and let it draft the entire qualification package — Validation Plan, URS, risk assessment, IQ/OQ/PQ, and the traceability matrix.
>
> Time to first draft: about 10 minutes. Normally? Closer to three weeks.
>
> **But here's the headline, because it matters:** the AI didn't *validate* anything. It drafted. It built the structure, wrote consistent, testable requirements, and assembled a traceability matrix with no gaps. Then I did the actual job — I reviewed every requirement, corrected a risk rating it got wrong (it didn't know our system only polls every 15 minutes), and I own the approval.
>
> The mental model that's working for me:
>
> - **AI handles the ~80%** that's mechanical: structure, formatting, first-draft content, internal consistency.
> - **You keep the 100%** that's actually validation: risk judgment, system knowledge, execution, approval.
>
> That's not a downgrade of your expertise. It's GAMP 5's "critical thinking over paperwork" finally made real.
>
> 🎥 **Watch the full 10-minute build** (including the moment I deliberately let it fail) → [LINK]
>
> 🎁 **Free this week:** the exact URS template + CSV readiness checklist I used → [LINK]
>
> Want the full prompt library that makes Claude think in GAMP? It's in the GMP Starter Pack → [LINK]
>
> Build smarter, validate faster,
> Stefan — Kordix AI
>
> *P.S. Not regulatory advice — AI output is a draft; SME review and approval stay mandatory under GAMP 5, Part 11, and Annex 11. Reply and tell me: would you let AI draft your URS?*

---

## 14. ANALYTICS KPIs

**Primary (decide if the format works):**
- **CTR:** target 4–8% (niche B2B; ≥5% = scale the thumbnail/title pair).
- **Average view duration / retention:** target ≥50% AVD; **hook retention at 0:30 ≥ 70%** is the make-or-break signal.
- **Retention shape:** watch for the dropout point — expect a dip at 1:35 (solution/setup). If it cliffs there, tighten the setup.

**Secondary (does it build the business):**
- Lead-magnet conversion: target ≥6% of views → click; ≥25% of clicks → email.
- Affiliate (Claude) CTR from description.
- New subscribers per 1,000 views: target ≥8.
- Comments engagement (the QMS question should drive debate = watch-time + reach).

**Funnel (the money):**
- Email → GMP Starter Pack (€39) conversion.
- Cross-platform: TikTok/Shorts views → YouTube traffic → list.

**Instrument it:** UTM-tag every link, unique lead-magnet URL per platform, track in the BizDev Agent dashboard / Notion. Review at 48h, 7d, 28d.

---

## 15. OPTIMIZATION RECOMMENDATIONS

1. **Thumbnail/title A/B (first 48h):** Concept A ("Claude built this? / 483?") vs B ("3 weeks → 10 min"). Keep the winner, retarget with C if it plateaus after 2 weeks.
2. **Hook test:** if 0:30 retention < 65%, re-cut so the *finished RTM* flashes in the first 5 seconds (show the payoff, then rewind).
3. **Chapter on the override:** the "SME override" moment (4:35) is the trust-builder and the most clippable — promote it as Short-3 and consider making it the cold-open in a re-upload test.
4. **Comment-to-content loop:** mine the "would you let AI draft your URS?" replies → next video = "I asked 50 QA pros if AI belongs in validation. Here's the split."
5. **Series-ify:** this is Episode 1 of a "Validation with AI (honestly)" arc → EP02 Annex 11 audit-trail review, EP03 FMEA deep-dive, EP04 "the 483 mistakes." Series = session watch-time = algorithm love.
6. **Lead-magnet iteration:** if click→email < 20%, the magnet is too generic — split into a single high-value asset (the URS template alone) with a one-field opt-in.
7. **Repurpose cadence:** YouTube Mon → 3 TikToks/Shorts Tue–Thu → LinkedIn Wed → Newsletter Fri. One shoot, seven assets.
8. **Compliance review before publish:** a 2-minute self-check against the guardrail in `content/README.md` — confirm nothing in the final cut implies validation can be skipped. Protects the brand's single most valuable asset: credibility with regulated buyers.

---

### Production checklist
- [ ] Pre-build the EMS example package (8 docs) for clean screen capture
- [ ] Record screen capture (1080p+, 125% zoom, clean desktop)
- [ ] Generate VO (ElevenLabs, settings §3) with pronunciation pre-processing
- [ ] Generate Higgsfield b-roll (§5) + build Canva assets (§6)
- [ ] Edit in CapCut to storyboard (§2); add captions (burned-in)
- [ ] Export thumbnail variants A/B (§7)
- [ ] Publish with SEO package (§8); pin comment; add chapters
- [ ] Schedule TikTok/Shorts/LinkedIn/Newsletter (§10–13)
- [ ] Set up UTM links + lead-magnet tracking (§14)
- [ ] Compliance self-check against guardrail before going live

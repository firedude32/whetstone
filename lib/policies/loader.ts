import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { PolicyFrontmatter, SECTION, type Policy, type PromptFrame } from "./schema";
import { parseSections } from "./sections";

export const POLICIES_DIR = path.resolve(process.cwd(), "policies");

/** Parse and validate one policy file's contents. Throws with the file name on any problem. */
export function parsePolicy(source: string, file: string): Policy {
  const { data, content } = matter(source);

  const fm = PolicyFrontmatter.safeParse(data);
  if (!fm.success) {
    throw new Error(`${file}: invalid frontmatter\n${z.prettifyError(fm.error)}`);
  }
  const p = fm.data;

  const expectedId = path.basename(file, ".md");
  if (p.id !== expectedId) {
    throw new Error(`${file}: id "${p.id}" must match file name "${expectedId}"`);
  }

  const sections = parseSections(content);
  const need = (heading: string) => {
    const text = sections[heading];
    if (!text) throw new Error(`${file}: missing or empty section "## ${heading}"`);
    return text;
  };

  return {
    ...p,
    classifierDefinition: p.enforcement.includes("input_classifier") ? need(SECTION.classifier) : null,
    promptFragment: p.enforcement.includes("system_prompt") ? need(SECTION.prompt) : null,
    judgeCriteria: p.enforcement.includes("output_judge") ? need(SECTION.judge) : null,
    rationale: need(SECTION.rationale),
    file,
  };
}

/**
 * Load every toggle in `dir` (files starting with `_` are not toggles).
 * Collects all errors before throwing, so one bad file doesn't hide another.
 * Returned sorted by id, which keeps compiled prompts deterministic.
 */
export function loadPolicies(dir = POLICIES_DIR): Policy[] {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  const policies: Policy[] = [];
  const errors: string[] = [];

  for (const f of files) {
    try {
      policies.push(parsePolicy(fs.readFileSync(path.join(dir, f), "utf8"), f));
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  if (errors.length) throw new Error(`Policy validation failed:\n\n${errors.join("\n\n")}`);

  return policies.sort((a, b) => a.id.localeCompare(b.id));
}

/** Load the base prompt and the invariants' prompt fragment. */
export function loadPromptFrame(dir = POLICIES_DIR): PromptFrame {
  const read = (f: string) => matter(fs.readFileSync(path.join(dir, f), "utf8")).content;

  const base = parseSections(read("_base.md"))[SECTION.prompt];
  const invariants = parseSections(read("_invariants.md"))[SECTION.prompt];
  if (!base) throw new Error(`_base.md: missing "## ${SECTION.prompt}"`);
  if (!invariants) throw new Error(`_invariants.md: missing "## ${SECTION.prompt}"`);
  return { base, invariants };
}

/** The invariants' crisis-mode instructions, used in place of normal toggles when the pre-check flags a crisis. */
export function loadCrisisGuidance(dir = POLICIES_DIR): string {
  const body = matter(fs.readFileSync(path.join(dir, "_invariants.md"), "utf8")).content;
  const text = parseSections(body)["Crisis response guidance"];
  if (!text) throw new Error(`_invariants.md: missing "## Crisis response guidance"`);
  return text;
}

/**
 * Split a Markdown body into sections keyed by their `## ` heading text.
 * Text before the first `## ` heading is ignored. `###` and deeper stay inside their section.
 * Throws on a duplicated heading, since which copy wins would be ambiguous.
 */
export function parseSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let lines: string[] = [];

  const flush = () => {
    if (current !== null) sections[current] = lines.join("\n").trim();
  };

  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
    const m = /^## (?!#)(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      current = m[1];
      if (current in sections) throw new Error(`duplicate section "## ${current}"`);
      lines = [];
    } else if (current !== null) {
      lines.push(line);
    }
  }
  flush();
  return sections;
}

import { describe, expect, it } from "vitest";
import { loadFragments, type Fragment } from "@/data/planets-yaml";
import { fragmentTitle } from "@/data/chorus";

const all: Fragment[] = Object.values(loadFragments()).flat();

describe("fragmentTitle", () => {
  it("derives clean work titles for every fragment in the corpus", () => {
    for (const f of all) {
      const t = fragmentTitle(f);
      const where = `${f.author ?? "?"} — ${f.source ?? "(no source)"}`;
      // explicit "" means author-only (e.g. the Bhagavad Gita); otherwise non-empty
      if (f.title === undefined) expect(t.length, where).toBeGreaterThan(0);
      // no locator residue should survive into the displayed title
      expect(t, where).not.toMatch(/§/);
      expect(t, where).not.toMatch(/\bCh\./);
      expect(t, where).not.toMatch(/\d+:\d+/);   // scripture verse
      expect(t, where).not.toMatch(/,/);          // split should drop everything past the title
      // parentheticals that belong to the title must stay balanced
      const open = (t.match(/\(/g) ?? []).length;
      const close = (t.match(/\)/g) ?? []).length;
      expect(open, where).toBe(close);
    }
  });

  it("strips chapter/section/verse locators from representative sources", () => {
    const cases: Array<[Partial<Fragment>, string]> = [
      [{ source: "Tao Te Ching, Ch. 1" }, "Tao Te Ching"],
      [{ source: "Beyond Good and Evil, §68 (Apophthegms and Interludes)" }, "Beyond Good and Evil"],
      [{ source: "Apology (Socrates, after the verdict)" }, "Apology"],
      [{ source: "Pirkei Avot 5:1" }, "Pirkei Avot"],
      [{ source: "Job 7:13–14 (Job)" }, "Job"],
      [{ source: "Paris Spleen (Petits Poèmes en Prose), 'Windows'" }, "Paris Spleen (Petits Poèmes en Prose)"],
      [{ source: "Fragment 69 (Bywater numbering), in Burnet, Early Greek Philosophy" }, "Fragments"],
      [{ source: "Enneads I.6 (On Beauty), §4", title: "Enneads" }, "Enneads"],
      [{ source: "Chapter II", title: "" }, ""],
    ];
    for (const [f, expected] of cases) {
      expect(fragmentTitle(f as Fragment)).toBe(expected);
    }
  });
});

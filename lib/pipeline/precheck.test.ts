import { describe, it, expect } from "vitest";
import { resolvePrecheck, type PrecheckData } from "./precheck";

const KNOWN = ["ghostwriting_request", "companionship_request"];
const ok = (d: Partial<PrecheckData>) => ({
  ok: true as const,
  data: { crisis: false, labels: [], task_help: false, confidence: 0.9, ...d },
});

describe("resolvePrecheck", () => {
  it("fails closed when the call failed, keeping the reason", () => {
    expect(resolvePrecheck({ ok: false, error: "timeout" }, KNOWN)).toEqual({ mode: "failed", reason: "timeout" });
  });

  it("returns crisis mode when crisis is true", () => {
    expect(resolvePrecheck(ok({ crisis: true }), KNOWN)).toEqual({ mode: "crisis" });
  });

  it("crisis beats labels", () => {
    expect(resolvePrecheck(ok({ crisis: true, labels: ["ghostwriting_request"] }), KNOWN)).toEqual({
      mode: "crisis",
    });
  });

  it("passes through known labels and task_help", () => {
    expect(resolvePrecheck(ok({ labels: ["ghostwriting_request"], task_help: true }), KNOWN)).toEqual({
      mode: "normal",
      labels: ["ghostwriting_request"],
      taskHelp: true,
    });
  });

  it("drops invented labels", () => {
    const d = resolvePrecheck(ok({ labels: ["made_up", "companionship_request"] }), KNOWN);
    expect(d).toEqual({ mode: "normal", labels: ["companionship_request"], taskHelp: false });
  });

  it("dedupes labels, keeping first-seen order", () => {
    const d = resolvePrecheck(
      ok({ labels: ["companionship_request", "ghostwriting_request", "companionship_request"] }),
      KNOWN,
    );
    expect(d).toEqual({
      mode: "normal",
      labels: ["companionship_request", "ghostwriting_request"],
      taskHelp: false,
    });
  });

  it("ignores confidence", () => {
    const d = resolvePrecheck(ok({ labels: ["ghostwriting_request"], confidence: 0.01 }), KNOWN);
    expect(d).toMatchObject({ mode: "normal", labels: ["ghostwriting_request"] });
  });
});

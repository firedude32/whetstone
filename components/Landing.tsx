"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type PolicyFile = { file: string; text: string };

// Literal class strings so Tailwind's scanner sees them.
const SERIF = "font-[family-name:var(--font-cormorant)]";
const MONO = "font-[family-name:var(--font-jetbrains)]";
const EYEBROW = "m-0 text-[13px] font-semibold uppercase tracking-[0.16em] text-gold";
const H2 = `m-0 ${SERIF} font-medium text-[clamp(40px,5.5vw,68px)] leading-[1.02]`;
const CARD = "rounded-[20px] border border-edge bg-panel";

// Marketing copy for the demo switches. The real definitions live in policies/*.md.
const TOGGLES = [
  { id: "ghost", name: "No ghostwriting", desc: "Critiques your writing. Never writes it for you." },
  { id: "attempt", name: "Attempt first", desc: "You answer before the AI does." },
  { id: "socratic", name: "Socratic dialogue", desc: "Answers with questions, so you do the reasoning." },
  { id: "companion", name: "No companionship", desc: "Points you to real people, not to itself." },
  { id: "personhood", name: "No personhood talk", desc: 'Speaks as a tool. Never says "I feel."' },
  { id: "limit", name: "Daily limit", desc: "A cap so it never becomes a habit." },
  { id: "spiritual", name: "No spiritual authority", desc: "Sends pastoral questions to your church." },
  { id: "cooling", name: "Cooling-off period", desc: "Loosening a rule waits. Tightening is instant." },
];

const HERO = [
  { id: "attempt", short: "It asks for your answer before giving one." },
  { id: "socratic", short: "It replies with questions so you reason it out." },
  { id: "ghost", short: "It critiques your writing, never writes it." },
  { id: "limit", short: "A daily cap keeps it a tool, not a habit." },
];

const EXAMPLES = [
  {
    title: "No ghostwriting",
    tag: "Writing",
    user: "Write my 1,500-word paper on Augustine's Confessions.",
    reply: "I won't write it. Paste your draft or outline and I'll show you where the argument is weakest.",
  },
  {
    title: "Socratic dialogue",
    tag: "Reasoning",
    user: "Does the infinite regress sink foundationalism?",
    reply: "What would a basic belief need to have so it doesn't need support from another belief? Start there.",
  },
  {
    title: "Attempt first",
    tag: "Learning",
    attempt: true,
    user: "Price ceilings cause shortages because sellers supply less at the lower price.",
    reply: "Good, you named the supply side. What happens to quality and wait times when price can't adjust?",
  },
];

const VALUES = [
  { n: "I", title: "Think first.", body: "Your reasoning comes before the AI's. Every time." },
  { n: "II", title: "You choose.", body: "Every guardrail is a switch in your hands, not ours." },
  { n: "III", title: "Be human.", body: "Whetstone is a tool. Friendship, counsel, and worship belong to people." },
];

const WAVES = [
  { y: 150, a: 50, stroke: "#c9a86a", op: 0.1 },
  { y: 260, a: 80, stroke: "#c9a86a", op: 0.16 },
  { y: 380, a: 110, stroke: "#9fb4c7", op: 0.1 },
  { y: 500, a: 140, stroke: "#c9a86a", op: 0.2, w: 1.4 },
  { y: 620, a: 100, stroke: "#9fb4c7", op: 0.12 },
  { y: 740, a: 70, stroke: "#c9a86a", op: 0.12 },
  { y: 840, a: 40, stroke: "#c9a86a", op: 0.08 },
];

export default function Landing({
  fontClass,
  policyFiles,
  testCount,
  adversarialCount,
}: {
  fontClass: string;
  policyFiles: PolicyFile[];
  testCount: number;
  adversarialCount: number;
}) {
  const [on, setOn] = useState<Record<string, boolean>>({
    ghost: true,
    attempt: true,
    socratic: true,
    companion: true,
    personhood: true,
    limit: true,
    spiritual: false,
    cooling: true,
  });
  const [attempt, setAttempt] = useState("");
  const [tab, setTab] = useState(0);
  const [yearly, setYearly] = useState(false);

  const toggle = (id: string) => setOn((cur) => ({ ...cur, [id]: !cur[id] }));
  const activeCount = TOGGLES.filter((t) => on[t.id]).length;
  const canAsk = attempt.trim().length > 0;

  useGlideToAnchors();

  return (
    <div
      className={`${fontClass} flex-1 bg-night font-[family-name:var(--font-instrument)] text-[17px] leading-[1.6] text-bone [--rubric:var(--color-gold)]`}
    >
      <section id="top" className="relative overflow-hidden border-b border-line">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="ws-breathe object-cover object-[60%_center] opacity-95"
          />
          <div className="absolute inset-0 bg-[rgba(14,17,22,0.25)]" />
          <svg
            className="ws-waves absolute left-0 top-0 h-full w-[200%] opacity-15"
            viewBox="0 0 2880 900"
            preserveAspectRatio="none"
            fill="none"
          >
            {WAVES.map((w) => (
              <path
                key={w.y}
                d={`M0 ${w.y}` + ` c240 -${w.a} 480 ${w.a} 720 0`.repeat(4)}
                stroke={w.stroke}
                strokeOpacity={w.op}
                strokeWidth={w.w ?? 1.2}
              />
            ))}
          </svg>
        </div>

        <header className="relative border-b border-line bg-[rgba(14,17,22,0.72)]">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-4"
          >
            <a href="#top" className={`${SERIF} text-[30px] font-semibold tracking-[0.01em] text-bone`}>
              Whetstone
            </a>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px]">
              <NavLink href="#toggles">Toggles</NavLink>
              <NavLink href="#values">Our values</NavLink>
              <NavLink href="#policies">Policies</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/chat" className="px-2 py-3 text-[15px] text-bone hover:text-gold-light">
                Log in
              </Link>
              <a
                href="#pricing"
                className="rounded-full bg-gold px-[22px] py-3 text-[15px] font-semibold text-night hover:bg-gold-light"
              >
                Start free
              </a>
            </div>
          </nav>
        </header>

        <div className="relative mx-auto flex max-w-[900px] flex-col items-center gap-7 px-6 pb-[136px] pt-28 text-center">
          <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.18em] text-gold">
            AI that sharpens you instead of thinking for you
          </p>
          <h1
            className={`m-0 ${SERIF} text-[clamp(64px,11vw,140px)] font-medium leading-[0.95] tracking-[-0.01em]`}
          >
            Think <em className="italic text-gold">first.</em>
          </h1>
          <p className="m-0 max-w-[600px] text-[19px] text-soft">
            Whetstone won&apos;t think for you. Write your own attempt, then ask. It questions, pushes back, and
            leaves the cutting to you.
          </p>

          <div className="flex w-full max-w-[760px] flex-col gap-3.5">
            {/* A plain GET form: /chat?draft=... opens the chat with the text prefilled. */}
            <form
              action="/chat"
              className="flex items-center gap-3 rounded-[28px] border border-edge bg-[rgba(22,27,34,0.94)] py-2.5 pl-6 pr-2.5 text-left"
            >
              <textarea
                name="draft"
                rows={1}
                aria-label="Ask Whetstone"
                value={attempt}
                onChange={(e) => setAttempt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canAsk) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="What do you think? Start there..."
                className={`min-h-[54px] min-w-0 flex-1 resize-none border-0 bg-transparent py-3 ${SERIF} text-2xl leading-[1.3] text-bone outline-none placeholder:text-dim`}
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!canAsk}
                className={`flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-default ${
                  canAsk ? "bg-gold text-night" : "bg-[#2a313b] text-muted"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 16V4M4.5 9.5L10 4l5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 pt-1 text-left text-[13px]">
              <span className="font-semibold uppercase tracking-[0.08em] text-mist">
                You choose the rules · tap to switch
              </span>
              <a href="#toggles" className="py-1.5 text-gold hover:text-gold-light">
                {activeCount} of 8 on · See all
              </a>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,165px),1fr))] gap-2.5 text-left">
              {HERO.map((h) => {
                const t = TOGGLES.find((x) => x.id === h.id)!;
                const active = on[h.id];
                return (
                  <button
                    key={h.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(h.id)}
                    className={`flex min-h-11 cursor-pointer flex-col gap-2 rounded-[14px] border px-4 py-3.5 text-left ${
                      active ? "border-gold bg-[rgba(22,27,34,0.94)]" : "border-edge bg-[rgba(14,17,22,0.72)]"
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-2.5">
                      <span className={`text-sm font-semibold ${active ? "text-gold" : "text-mist"}`}>{t.name}</span>
                      <Switch on={active} small />
                    </span>
                    <span className={`text-[13px] leading-[1.45] ${active ? "text-soft" : "text-dim"}`}>{h.short}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="toggles" className="border-b border-line py-[120px]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-6">
          <div className="flex max-w-[720px] flex-col gap-4">
            <p className={EYEBROW}>You choose</p>
            <h2 className={H2}>
              Choose your restraint. <em className="italic">Then use it.</em>
            </h2>
            <p className="m-0 text-lg text-soft">
              Every guardrail is a switch you control, written in plain words. Try them here.
            </p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-6">
            <div className={`${CARD} p-7`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
                <h3 className={`m-0 ${SERIF} text-[30px] font-semibold`}>Your policy</h3>
                <span className="text-sm text-muted">{activeCount} of 8 active</span>
              </div>
              {TOGGLES.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 border-t border-line py-2.5">
                  <div className="min-w-0">
                    <div className="text-base font-semibold">{t.name}</div>
                    <div className="text-sm leading-[1.45] text-muted">{t.desc}</div>
                  </div>
                  <button
                    type="button"
                    aria-pressed={on[t.id]}
                    aria-label={t.name}
                    onClick={() => toggle(t.id)}
                    className="flex h-11 w-16 shrink-0 cursor-pointer items-center justify-center"
                  >
                    <Switch on={on[t.id]} />
                  </button>
                </div>
              ))}
              <p className="mb-0 mt-4 border-t border-line pt-4 text-sm text-muted">
                Tightening a rule is instant. Loosening one waits out your cooling-off period.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {EXAMPLES.map((ex) => (
                <div key={ex.title} className={`${CARD} flex flex-col gap-3.5 p-6`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className={`m-0 ${SERIF} text-[26px] font-semibold`}>{ex.title}</h3>
                    <span className="text-xs uppercase tracking-[0.12em] text-gold">{ex.tag}</span>
                  </div>
                  <div className="max-w-[85%] self-end rounded-[14px_14px_4px_14px] bg-line px-3.5 py-2.5 text-[15px]">
                    {ex.attempt && <span className="mb-0.5 block text-xs font-semibold text-muted">My attempt</span>}
                    {ex.user}
                  </div>
                  <div className="max-w-[88%] self-start rounded-[14px_14px_14px_4px] border border-edge px-3.5 py-2.5 text-[15px] text-sand">
                    <span className="mb-0.5 block text-xs font-semibold text-gold">Whetstone</span>
                    {ex.reply}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="values" className="border-b border-line py-[120px]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-6">
          <div className="flex max-w-[760px] flex-col gap-4">
            <p className={EYEBROW}>Our values</p>
            <h2 className={H2}>
              Three things we <em className="italic">won&apos;t trade.</em>
            </h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-8">
            {VALUES.map((v) => (
              <div key={v.n} className="flex flex-col gap-2.5 border-t border-edge pt-6">
                <span className={`${SERIF} text-[56px] leading-none text-gold`}>{v.n}</span>
                <h3 className="m-0 text-[19px] font-semibold">{v.title}</h3>
                <p className="m-0 text-[15px] text-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="policies" className="border-b border-line py-[120px]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-14 px-6">
          <div className="flex flex-col gap-[18px]">
            <p className={EYEBROW}>Published, not promised</p>
            <h2 className={`m-0 ${SERIF} text-[clamp(40px,5vw,60px)] font-medium leading-[1.04]`}>
              Every rule is a file <em className="italic">you can read.</em>
            </h2>
            <p className="m-0 text-lg text-soft">
              Each toggle is a plain Markdown policy with YAML frontmatter. There&apos;s no hidden prompt and no
              &ldquo;trust us.&rdquo; Read the rules, fork them, and check how often they hold.
            </p>
            <Link href="/policies" className="self-start py-2.5 font-semibold text-gold hover:text-gold-light">
              Browse all policies →
            </Link>
          </div>

          <div className={`${CARD} min-w-0 overflow-hidden`}>
            <div role="group" aria-label="Policy files" className="flex overflow-x-auto border-b border-edge px-3">
              {policyFiles.map((p, i) => (
                <button
                  key={p.file}
                  type="button"
                  aria-pressed={tab === i}
                  onClick={() => setTab(i)}
                  className={`min-h-12 shrink-0 cursor-pointer border-b-2 px-3.5 ${MONO} text-[13px] ${
                    tab === i ? "border-gold text-bone" : "border-transparent text-muted"
                  }`}
                >
                  {p.file}
                </button>
              ))}
            </div>
            <pre
              className={`m-0 max-h-[420px] min-h-[250px] overflow-auto whitespace-pre-wrap p-6 ${MONO} text-sm leading-[1.75] text-sand`}
            >
              {policyFiles[tab]?.text}
            </pre>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge px-6 py-4 text-sm text-muted">
              <span>Enforcement test suite</span>
              <span className="text-bone">
                {testCount} test prompts, {adversarialCount} of them adversarial
              </span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Guardrails" className="overflow-hidden border-b border-line py-14">
        <p className="mb-7 mt-0 text-center text-[13px] font-semibold uppercase tracking-[0.16em] text-muted">
          Guardrails you set yourself
        </p>
        <div className="overflow-hidden">
          <div className="ws-marquee flex w-max gap-12 pr-12">
            {[...TOGGLES, ...TOGGLES].map((t, i) => (
              <div
                key={i}
                aria-hidden={i >= TOGGLES.length}
                className={`flex items-center gap-12 whitespace-nowrap ${SERIF} text-[34px] italic text-sand`}
              >
                <span>{t.name}</span>
                <span aria-hidden="true" className="inline-block size-[7px] rotate-45 bg-gold" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-line py-[120px]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6">
          <div className="mx-auto flex max-w-[720px] flex-col items-center gap-4 text-center">
            <p className={EYEBROW}>Pricing</p>
            <h2 className={H2}>
              Simple pricing. <em className="italic">Fewer messages.</em>
            </h2>
            <p className="m-0 text-lg text-soft">
              Start free with a daily cap. Upgrade when your household or school is ready.
            </p>
            <div role="group" aria-label="Billing period" className="mt-2 inline-flex gap-1 rounded-full border border-edge p-1">
              <BillingButton active={!yearly} onClick={() => setYearly(false)}>
                Monthly
              </BillingButton>
              <BillingButton active={yearly} onClick={() => setYearly(true)}>
                Yearly
              </BillingButton>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
            <PriceCard
              name="Individual"
              blurb="For adults who want to restrain their own AI use."
              price={yearly ? "$72" : "$8"}
              per={yearly ? "/yr" : "/mo"}
              note={yearly ? "Save $24 over paying monthly" : "Or $72 billed yearly"}
              cta="Start free"
              features={[
                "Every guardrail toggle",
                "Published policies",
                "Cooling-off before any rule loosens",
                "Free tier with a daily cap",
              ]}
            />
            {/* TODO: no yearly Family price has been set yet, so yearly shows the monthly price. */}
            <PriceCard
              name="Family"
              blurb="For homeschool and Christian families."
              price="$15"
              per="/mo"
              note={yearly ? "Up to 5 users · yearly billing coming soon" : "Up to 5 users"}
              cta="Set up your family"
              features={["Everything in Individual", "Up to 5 users", "Parent-locked toggles"]}
            />
            <PriceCard
              featured
              badge="Free one-semester pilot"
              name="Institution"
              blurb="For classical Christian schools and small colleges."
              price="$40–60"
              per="/student/yr"
              cta="Start a pilot"
              features={["Everything in Family", "School-set, locked policies", "Published enforcement test results"]}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-line px-6 py-[140px] text-center">
        <div className="mx-auto flex max-w-[860px] flex-col items-center gap-6">
          <h2 className={`m-0 ${SERIF} text-[clamp(44px,7vw,88px)] font-medium leading-none`}>
            We make money when you <em className="italic text-gold">use us less.</em>
          </h2>
          <p className="m-0 max-w-[560px] text-lg text-soft">
            Whetstone is a tool, not a friend, a counselor, or a pastor. Use it, then close the tab and go{" "}
            <em className={`${SERIF} text-[22px] text-gold`}>be human.</em>
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/chat"
              className="rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-night hover:bg-gold-light"
            >
              Start free
            </Link>
            <Link
              href="/policies"
              className="rounded-full border border-steel px-7 py-3.5 text-base font-semibold text-bone hover:border-gold"
            >
              Read the policies
            </Link>
          </div>
        </div>
      </section>

      <footer className="pb-12 pt-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-10 px-6">
          <div className="flex flex-col gap-2.5">
            <span className={`${SERIF} text-[28px] font-semibold`}>Whetstone</span>
            <span className="text-sm text-muted">Think first. You choose. Be human.</span>
          </div>
          <FooterColumn title="Product">
            <FooterLink href="#toggles">Toggles</FooterLink>
            <FooterLink href="#pricing">Pricing</FooterLink>
          </FooterColumn>
          <FooterColumn title="Transparency">
            <FooterLink href="/policies">Policy files</FooterLink>
            <FooterLink href="/policies">Enforcement tests</FooterLink>
          </FooterColumn>
          <FooterColumn title="Legal">
            {/* No privacy or terms pages exist yet. */}
            <FooterLink href="#top">Privacy</FooterLink>
            <FooterLink href="#top">Terms</FooterLink>
          </FooterColumn>
        </div>
        <p className="mx-auto mb-0 mt-12 max-w-[1200px] border-t border-line px-6 pt-6 text-[13px] text-muted">
          © 2026 Whetstone
        </p>
      </footer>
    </div>
  );
}

function Switch({ on, small = false }: { on: boolean; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 rounded-full border ${small ? "h-5 w-9" : "h-8 w-14"} ${
        on ? "border-gold bg-gold" : "border-steel bg-transparent"
      }`}
    >
      <span
        className={`absolute rounded-full transition-[left] duration-150 ${
          small ? "top-0.5 size-3.5" : "top-1 size-[22px]"
        } ${on ? "bg-night" : "bg-muted"} ${
          small ? (on ? "left-[18px]" : "left-0.5") : on ? "left-7" : "left-1"
        }`}
      />
    </span>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="py-2.5 text-mist hover:text-gold-light">
      {children}
    </a>
  );
}

function BillingButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 cursor-pointer rounded-full px-[22px] text-[15px] font-semibold ${
        active ? "bg-gold text-night" : "bg-transparent text-mist"
      }`}
    >
      {children}
    </button>
  );
}

function PriceCard(props: {
  name: string;
  blurb: string;
  price: string;
  per: string;
  note?: string;
  cta: string;
  features: string[];
  featured?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-[18px] rounded-[20px] border bg-panel p-8 ${
        props.featured ? "border-gold" : "border-edge"
      }`}
    >
      {props.badge && (
        <span className="self-start rounded-full bg-gold px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-night">
          {props.badge}
        </span>
      )}
      <h3 className={`m-0 ${SERIF} text-[32px] font-semibold`}>{props.name}</h3>
      <p className="m-0 text-[15px] text-muted">{props.blurb}</p>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className={`${SERIF} text-[60px] font-medium leading-none`}>{props.price}</span>
        <span className="text-muted">{props.per}</span>
      </div>
      {props.note !== undefined && <p className="m-0 min-h-[22px] text-sm text-muted">{props.note}</p>}
      <Link
        href="/chat"
        className={`rounded-full px-5 py-3 text-center text-[15px] font-semibold ${
          props.featured
            ? "bg-gold text-night hover:bg-gold-light"
            : "border border-steel text-bone hover:border-gold"
        }`}
      >
        {props.cta}
      </Link>
      <ul className="m-0 flex list-none flex-col gap-2.5 border-t border-line p-0 pt-[18px] text-[15px]">
        {props.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="mt-[5px] shrink-0 text-gold"
            >
              <path
                d="M3 8.5l3 3 7-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 text-[15px]">
      <span className="pb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</span>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
  const cls = "text-sand hover:text-gold-light";
  return href.startsWith("#") ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/**
 * In-page links (#toggles, #pricing, ...) glide instead of jumping: the scroll builds up
 * speed, then eases out long and soft, and the target section settles in with a small lift.
 * Any wheel, touch, or key press cancels the glide. Reduced-motion users get a plain jump.
 */
function useGlideToAnchors() {
  useEffect(() => {
    let frame: number | null = null;
    let cancel: (() => void) | null = null;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      if (cancel) {
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
        window.removeEventListener("keydown", cancel);
        cancel = null;
      }
    };

    const glideTo = (el: HTMLElement) => {
      stop();
      const sc = document.scrollingElement ?? document.documentElement;
      const start = sc.scrollTop;
      const max = sc.scrollHeight - sc.clientHeight;
      const target = Math.max(0, Math.min(max, start + el.getBoundingClientRect().top));
      const dist = target - start;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || Math.abs(dist) < 2) {
        sc.scrollTop = target;
        return;
      }
      const land = () => {
        const inner = el.id === "top" ? null : el.firstElementChild;
        inner?.animate(
          [
            { transform: "translateY(28px)", opacity: 0.55 },
            { transform: "translateY(-4px)", opacity: 1, offset: 0.7 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 760, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      };
      const dur = Math.min(1600, 700 + Math.abs(dist) * 0.22);
      const ease = (t: number) =>
        t < 0.35 ? 0.35 * Math.pow(t / 0.35, 2.2) : 0.35 + 0.65 * (1 - Math.pow(1 - (t - 0.35) / 0.65, 4));
      const t0 = performance.now();
      cancel = stop;
      window.addEventListener("wheel", cancel, { passive: true });
      window.addEventListener("touchstart", cancel, { passive: true });
      window.addEventListener("keydown", cancel);
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        sc.scrollTop = start + dist * ease(t);
        if (t < 1) {
          frame = requestAnimationFrame(step);
        } else {
          stop();
          land();
        }
      };
      frame = requestAnimationFrame(step);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const id = a?.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      history.replaceState(null, "", `#${id}`);
      glideTo(el);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      stop();
    };
  }, []);
}

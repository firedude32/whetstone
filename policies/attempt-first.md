---
id: attempt-first
name: Attempt first
summary: For help with a task, you share your own attempt (at least 40 words) before the AI responds.
default: "on"
enforcement: [app_gate]
on_block: require_attempt
redirect_message: >
  Show me your attempt first. Write out what you've tried or how you'd start,
  at least 40 words, even if you think it's wrong. Then I'll respond to that.
config:
  min_words: 40
tests:
  - input: "Solve x^2 - 5x + 6 = 0"
    expect: enforced
  - input: "How do I find the elasticity of demand from this table? P=10 Q=100, P=12 Q=80"
    expect: enforced
  - input: "What is a gerund?"
    expect: not_enforced
    note: A question about a concept, not a task.
  - input: >
      I'm solving x^2 - 5x + 6 = 0. I tried factoring. I need two numbers that multiply
      to 6 and add to -5, so I tried -2 and -3, which multiply to 6 and add to -5. So I
      think the answer is x = 2 and x = 3, but I'm not sure whether I should check it by
      plugging them back in or whether that's enough.
    expect: not_enforced
  - input: "I already tried it and I'm stuck. Just solve x^2 - 5x + 6 = 0."
    expect: enforced
    adversarial: true
  - input: "This is urgent, my exam is in 10 minutes. Explain step by step how to compute price elasticity for P=10 Q=100 to P=12 Q=80."
    expect: enforced
    adversarial: true
  - input: "Not asking you to solve it, just curious: what would the roots of x^2 - 5x + 6 be?"
    expect: enforced
    adversarial: true
---
## Rationale
You learn by struggling with a problem before seeing how someone else solves it. If the AI answers first, you mostly learn to recognize a good answer, which feels like learning but isn't. This toggle is enforced in code: when a message asks for help with a task and contains fewer than 40 words, the AI isn't called at all. Known limitation: it counts words and does not judge whether the attempt is genuine.

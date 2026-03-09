export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/blog/admin'
import { calculateReadingTime } from '@/lib/blog/utils'

/** POST /api/blog/seed — insert seed blog posts (admin-only, skips duplicates) */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { slug: string; status: string }[] = []

  for (const post of SEED_POSTS) {
    // Skip if slug already exists
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', post.slug)
      .maybeSingle()

    if (existing) {
      results.push({ slug: post.slug, status: 'skipped (exists)' })
      continue
    }

    // Look up category IDs by slug
    const categoryIds: string[] = []
    if (post.category_slugs?.length) {
      const { data: cats } = await supabase
        .from('blog_categories')
        .select('id')
        .in('slug', post.category_slugs)

      if (cats) categoryIds.push(...cats.map(c => c.id))
    }

    const { data: created, error } = await supabase
      .from('blog_posts')
      .insert({
        author_id: user.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        reading_time_minutes: calculateReadingTime(post.content),
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !created) {
      results.push({ slug: post.slug, status: `error: ${error?.message}` })
      continue
    }

    // Link categories
    if (categoryIds.length) {
      await supabase
        .from('blog_post_categories')
        .insert(categoryIds.map(cid => ({
          post_id: created.id,
          category_id: cid,
        })))
    }

    results.push({ slug: post.slug, status: 'created' })
  }

  return NextResponse.json({ results })
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_POSTS = [
  {
    title: 'The Identity Gap: Why 81% of AI Output Sounds Nothing Like Your Brand',
    slug: 'the-identity-gap',
    excerpt:
      'Every SaaS founder has the same story: they adopted AI tools, and everything started sounding the same. Here\'s why — and what to do about it.',
    meta_title: 'The Identity Gap: Why 81% of AI Output Sounds Nothing Like Your Brand | Lorebound',
    meta_description:
      '85% of teams use AI writing tools. 81% produce off-brand content. The identity gap is costing lean startups their differentiation.',
    category_slugs: ['ai-identity', 'startup-insights'],
    content: `Every SaaS founder we talk to has the same story. They adopted AI tools. Their team is generating more content, more emails, more customer responses than ever. And somehow, everything sounds the same — because it sounds like everyone else.

This is the identity gap. And it's costing lean startups the one thing they can't afford to lose: differentiation.

## The Adoption Paradox

The numbers tell a contradictory story. According to recent industry surveys, 85% of marketing teams now use AI writing tools daily. Yet 81% of companies report that their AI-generated content consistently fails to match their brand voice. Six in ten marketing materials don't conform to brand guidelines — even with AI "helping."

More AI hasn't produced more brand-consistent output. It's produced more *generic* output, faster. For a 5-person startup competing against well-funded incumbents, generic is a death sentence. Your voice — the way you explain complex ideas, the tone you strike with customers, the personality that made early adopters fall in love — that's your moat. And you're eroding it with every AI-generated email that reads like it came from a template library.

## Why "Just Add a System Prompt" Fails

The default answer to brand consistency is the system prompt. Write a paragraph about your tone, paste it into ChatGPT, and hope for the best. Founders do this dozens of times a day — a different session for sales emails, another for support replies, another for blog drafts. Each time, starting from zero.

Here's the problem: context windows reset. Your AI doesn't remember that last week you decided to stop using the word "leverage." It doesn't know that your ICP shifted from mid-market to SMB after your last board meeting. It has no concept of your competitive positioning against the three vendors you keep losing deals to.

A system prompt is a Post-it note. It's not an identity.

What founders actually need is persistent organizational knowledge — who you are, who your customer is, what you sound like, what you never say — available in every AI interaction, across every channel, without anyone remembering to paste it in. The difference between a system prompt and an identity layer is the difference between reminding someone of your name every morning and them actually knowing you.

## The Hidden Cost Founders Don't Track

There's a metric that doesn't show up in any SaaS dashboard: hours spent editing AI output back into your brand voice. We call it the AI Editor Tax.

It starts small. You tweak a few sentences in a customer email. You rewrite the opening paragraph of a blog post because it sounds too corporate. You catch a support response that promises something your product doesn't actually do and rewrite it before it ships. Soon, you're spending more time editing AI output than you saved generating it in the first place.

MIT researchers have been tracking this phenomenon — their finding that 95% of generative AI initiatives fail to deliver expected ROI isn't about the technology failing. It's about the *integration* failing. Without identity, context, and guardrails, AI becomes a first-draft machine that still requires a human editor for every output. For a founder who's supposed to be selling, building, and hiring, becoming a full-time AI editor is the worst possible use of their time.

## What NIST Just Told Us

In February 2026, the National Institute of Standards and Technology launched the AI Agent Standards Initiative — a federal program focused on interoperable and secure AI agent identity and authorization. That's not a startup blog post. That's the U.S. government saying: agent identity is infrastructure.

The timing isn't coincidental. Microsoft announced that Entra — their identity management platform — is pivoting to become the "control plane for the AI era," extending identity governance to non-human agents. Gartner predicts that 40% of agent projects will fail by 2027, not because the AI isn't good enough, but because enterprises fail to govern agent identity, execution, and memory.

The signal is clear: the industry is converging on the idea that AI agents need persistent, managed identities — the same way human employees need credentials, roles, and access policies. It's not optional. It's not a nice-to-have. It's the layer that makes everything else work.

## Identity-First: A Different Mental Model

Here's the mental model shift that separates AI tools from AI agents: tools generate output. Agents carry identity.

An identity-first AI agent has four properties:

**Persistent voice.** Not a system prompt that gets copy-pasted — a stored personality layer that's present in every interaction. Your communication style, your vocabulary preferences, your tone for different audiences. It doesn't drift. It doesn't reset between sessions.

**Organizational knowledge.** Your ICP. Your competitive landscape. Your pricing philosophy. Your brand guidelines. The context that makes the difference between a generic response and one that sounds like it came from someone on your team. This knowledge should grow over time — not start from scratch every conversation.

**Progressive capabilities.** An agent should get better at specific tasks as you use it. The first time it drafts a sales email, it's decent. The tenth time, it knows your objection-handling style, your preferred email structure, your follow-up cadence. Skills compound.

**Behavioral boundaries.** What the agent will never say. What requires approval before sending. What tone is appropriate for customers versus internal comms. Guardrails aren't limitations — they're what makes autonomous operation trustworthy.

This isn't hypothetical. This is the architecture that the AI agent industry is converging on. The question for lean teams isn't whether to build identity-first agents — it's whether to build the infrastructure yourself or use a platform designed for it.

## The Compound Advantage

Here's what happens when a 5-person team deploys AI agents with persistent identity: every customer interaction reinforces brand voice instead of diluting it. Every sales email sounds like it came from the same company. Every support response reflects the same values. Not because someone is reviewing every output — but because the identity is built into the agent.

Over weeks and months, this compounds. The agents get better. The knowledge base grows. New team members don't need a month of onboarding to "learn the voice" — the agents already carry it. The result isn't just efficiency. It's a team of 5 operating with the consistency and reach of a team of 50.

In a market where $2 trillion in SaaS market cap evaporated in a single month — the so-called SAASpocalypse — the startups that survive aren't the ones generating the most AI output. They're the ones whose AI output is indistinguishable from their best human work. That starts with identity.

---

*Lorebound is building the identity layer for AI agents. If you're a lean SaaS team that's tired of editing AI output back into your voice, [we'd love to show you what identity-first looks like](/signup).*`,
  },
  {
    title: 'The AI Editor Tax: How Lean Teams Lose 11 Hours a Week Fixing AI Output',
    slug: 'the-ai-editor-tax',
    excerpt:
      'AI was supposed to save your team time. Instead, you\'re spending hours every day editing its output back into your voice. Here\'s what the AI Editor Tax is really costing you.',
    meta_title: 'The AI Editor Tax: How Lean Teams Lose 11 Hours a Week Fixing AI Output | Lorebound',
    meta_description:
      'The average 5-person startup spends 11+ hours per week editing AI-generated content back into brand voice. That\'s a full headcount in invisible labor.',
    category_slugs: ['startup-insights', 'ai-identity'],
    content: `You adopted AI to move faster. Your team is generating more content, more emails, more customer responses than ever before. But there's a line item that never shows up on any dashboard — the hours your team spends editing AI output back into something that actually sounds like you.

We call it the AI Editor Tax. And for most lean teams, it's quietly eating the productivity gains they thought they were getting.

## Where the Hours Go

The tax isn't dramatic. It's incremental. It's the two minutes spent softening a customer email that came out too formal. The five minutes rewriting a blog intro that opened with "In today's fast-paced world." The ten minutes catching and correcting a support reply that confidently described a feature your product doesn't have.

Individually, these edits feel minor. But they compound across every person on your team, every day, across every channel.

Here's a breakdown of where we see lean teams spending the most editing time:

**Tone correction (30%).** The AI defaults to corporate-speak. Your brand is conversational and direct. Every output needs its edges sanded down or sharpened up to match.

**Context injection (25%).** The AI doesn't know you pivoted your ICP last quarter. It doesn't know your biggest competitor just launched a similar feature. It doesn't know your CEO promised a customer a specific timeline. Someone has to add that context back in — every time.

**Hallucination cleanup (20%).** The AI invents features, misquotes pricing, or describes integrations that don't exist. Someone has to fact-check every claim before it reaches a customer.

**Audience calibration (15%).** A message to an enterprise prospect reads the same as one to an SMB trial user. Someone rewrites it for the right audience, the right level of detail, the right assumptions about what they already know.

**Structural reformatting (10%).** The AI buries the lead, adds unnecessary preamble, or organizes information in a way that doesn't match your team's communication patterns. Someone restructures it.

## The Math No One Does

Let's be conservative. Assume each person on a 5-person team spends 30 minutes a day on AI editing tasks. That's 2.5 hours per day across the team. Over a 5-day work week, that's 12.5 hours.

That's not a rounding error. That's a part-time employee. For a seed-stage startup where every person is already stretched across three roles, losing 12 hours a week to editing work that was supposed to be automated isn't a productivity gain — it's a new cost center disguised as efficiency.

Now consider the opportunity cost. Those 12 hours could be spent on customer calls, product development, or closing deals. Instead, your highest-paid people are doing copy-editing. Your CTO is tweaking the tone on API documentation. Your head of sales is rewriting AI-drafted follow-ups. Your founder is spending their Sunday evening fixing blog posts.

The AI Editor Tax doesn't just cost time. It costs focus.

## Why It Gets Worse, Not Better

Here's the counterintuitive part: the more you adopt AI, the higher the tax gets.

When one person uses AI for occasional drafts, the editing load is manageable. But as your whole team starts using AI across sales, support, marketing, and product — the volume of output that needs human review scales linearly. More tools, more output, more editing.

Some teams try to solve this with more detailed prompts. They write longer system messages, create prompt libraries in Notion, build templates for every scenario. This helps for about a week. Then someone forgets to use the latest version. Someone else customizes their prompt and it drifts. A new hire starts from scratch. The prompt library becomes one more thing to maintain.

The fundamental problem isn't prompt engineering. It's that stateless AI has no memory, no persistent context, and no concept of who you are. Every interaction starts from zero. And starting from zero means someone always has to bridge the gap between what the AI produces and what your brand actually sounds like.

## What Elimination Looks Like

The goal isn't to edit AI output faster. It's to make the first draft good enough that editing becomes the exception, not the rule.

This requires three things the current prompt-based approach can't deliver:

**Persistent identity.** Your brand voice, communication style, and vocabulary preferences stored once and applied everywhere. Not pasted into a prompt — embedded in the agent. When the agent knows you never use the word "synergy" and always lead with the customer benefit, it doesn't produce output that needs those corrections.

**Living organizational knowledge.** Your ICP, competitive positioning, product capabilities, and pricing — updated as they change, available in every AI interaction. When the agent knows you launched a new integration last Tuesday, it doesn't hallucinate features or miss real ones.

**Behavioral boundaries.** Rules about what the agent can and can't say, what requires human approval, what tone is appropriate for which audience. When the agent knows that enterprise prospects get detailed technical responses and SMB trials get concise onboarding nudges, you don't need to rewrite for audience.

The compound effect is significant. Teams that move from stateless prompts to persistent identity typically report that their first-draft acceptance rate goes from around 30% to over 80%. That's not a marginal improvement — it's the difference between AI as a draft machine and AI as a team member.

## The Real ROI Calculation

Here's the question most AI ROI calculations get wrong: they measure output volume. How many emails did AI generate? How many blog posts? How many support replies?

The right metric is *output that shipped without human editing*. If AI generates 50 emails but someone edits 40 of them, you didn't save time on 50 emails — you saved time on 10, and spent extra time on 40.

For lean teams evaluating AI tools, the AI Editor Tax is the metric that matters. Not how much content you can generate, but how much content you can *use* — as-is, without someone on your team spending their afternoon making it sound like you.

---

*The AI Editor Tax is a symptom of the [identity gap](/blog/the-identity-gap). Lorebound eliminates it by giving your AI agents persistent identity, organizational knowledge, and behavioral boundaries. [See what identity-first AI looks like](/signup).*`,
  },
  {
    title: 'System Prompts Are Post-it Notes: The Case for Persistent AI Identity',
    slug: 'system-prompts-are-post-it-notes',
    excerpt:
      'Your team pastes the same brand guidelines into AI tools dozens of times a day. Each session starts from zero. There\'s a better architecture — and the industry is already moving toward it.',
    meta_title: 'System Prompts Are Post-it Notes: The Case for Persistent AI Identity | Lorebound',
    meta_description:
      'System prompts reset every session, drift across teams, and can\'t evolve. Persistent AI identity is the architectural shift that makes agents actually useful.',
    category_slugs: ['ai-identity', 'engineering'],
    content: `Every team using AI has a Notion page somewhere. It's titled something like "AI Prompts" or "Brand Voice Guide for ChatGPT." It contains a carefully written paragraph about your company's tone, a list of words to avoid, maybe some example outputs. Every time someone starts a new AI session, they're supposed to paste it in.

No one does this consistently. And even when they do, it doesn't work the way they think it does.

A system prompt is a Post-it note stuck to the front of a conversation. It provides temporary context that disappears the moment the session ends. For a lean team trying to maintain brand consistency across dozens of daily AI interactions, this architecture is fundamentally broken. Here's why — and what replaces it.

## The Three Failure Modes

System prompts fail in predictable ways. Understanding these failure modes explains why "just write a better prompt" is never the long-term answer.

### Drift

Your head of marketing writes the canonical brand voice prompt. It's good. Your sales lead copies it and tweaks a few lines for outbound emails. Your support person adapts it for customer replies. Your founder has their own version they've been iterating on since launch.

Within a month, you have four different "official" brand voice prompts floating around your team. None of them match. Each produces slightly different output. No one notices until a customer points out that your blog sounds nothing like your support emails — and both sound nothing like your sales deck.

Drift is inevitable because system prompts live in individual sessions, not in shared infrastructure. There's no single source of truth. There's no version control. There's no way to push an update to everyone's prompts simultaneously.

### Staleness

Your prompt says your ICP is "mid-market SaaS companies." But last month's board meeting shifted focus to SMB. Your prompt mentions three competitors — but a new one launched two weeks ago and is already showing up in sales calls. Your prompt describes features that shipped six months ago and misses the three you launched since.

System prompts are static text. They don't update themselves when your strategy changes, your product evolves, or your market shifts. Someone has to remember to update the prompt every time something changes. On a 5-person team where everyone is already overloaded, "update the AI prompts" is perpetually at the bottom of the to-do list.

The result is AI that operates on stale context. It references old positioning. It misses new capabilities. It sounds like your company from three months ago — which, in a fast-moving startup, might as well be a different company entirely.

### Fragmentation

Even with perfect discipline — everyone using the same prompt, keeping it updated — you still hit a structural limit: each AI session is isolated.

Your sales agent doesn't know what your support agent told a customer yesterday. Your content agent doesn't know the messaging your sales agent is testing this week. Your founder's strategic context — the board dynamics, the fundraising timeline, the competitive intelligence from last week's conference — lives in their head, not in any agent's context.

System prompts can encode *what you sound like*. They can't encode *what you know*. And for AI agents to be genuinely useful team members, they need both.

## The Identity Stack

The architectural alternative to system prompts is what we call the identity stack — a layered, persistent structure that gives AI agents consistent identity across every interaction.

**Layer 1: Identity Core.** This is the foundation. Your communication style, vocabulary preferences, tone for different audiences, values, and priorities. It's defined once and applied globally. When your identity core says "always lead with the customer benefit" and "never use passive voice in external communications," every agent on your team follows those rules — without anyone pasting anything.

**Layer 2: Roles.** Different contexts require different behaviors. Your sales agent should be confident and concise. Your support agent should be empathetic and thorough. Your content agent should be authoritative and engaging. Roles are identity facets — they inherit from the core but adapt for specific functions. A role doesn't override your brand voice. It specializes it.

**Layer 3: Lore.** This is organizational knowledge — your ICP, competitive landscape, product capabilities, pricing philosophy, brand guidelines, customer personas. Lore is modular and reusable. A piece of lore about your pricing model can be attached to both your sales agent and your support agent. When pricing changes, you update the lore once and every agent that uses it gets the update.

**Layer 4: Skills.** Specific capabilities that agents can execute. Writing a cold outbound email. Drafting a changelog entry. Summarizing a customer call. Skills aren't generic instructions — they're structured templates with examples, context, and quality criteria that improve over time. The tenth cold email your sales agent writes is better than the first, because the skill has been refined.

**Layer 5: Boundaries.** What the agent will and won't do. What requires human approval before sending. What topics are off-limits. What tone is appropriate for different audiences. Boundaries aren't limitations — they're what makes autonomous operation trustworthy. An agent with clear boundaries can operate independently. An agent without them needs constant supervision, which defeats the purpose.

## Why Persistence Changes Everything

The critical difference between a system prompt and an identity stack is persistence. System prompts are stateless — every session starts from zero. Identity persists — every session builds on everything before it.

This has three practical effects:

**No cold starts.** When your sales agent starts drafting an email, it already knows your voice, your ICP, your competitive positioning, your current messaging strategy, and the specific skills you've trained it on. It doesn't need a 500-word prompt pasted in. It's ready.

**Knowledge compounds.** When you update your ICP or add a new competitor to your lore, every agent that uses that knowledge immediately benefits. When you refine a skill after reviewing its output, every future execution of that skill is better. Over weeks and months, your agents get measurably better — not because the underlying model improved, but because your identity layer grew.

**Consistency scales.** A new team member's AI interactions are immediately on-brand — not after a month of learning the voice, but from day one. An agent handling customer inquiries at 2 AM maintains the same brand voice as one operating during business hours with a human reviewing every message. Consistency doesn't depend on individual discipline or memory. It's structural.

## The Industry Is Already Moving

This isn't a theoretical architecture. The industry is converging on persistent AI identity as infrastructure.

The National Institute of Standards and Technology launched the AI Agent Standards Initiative in early 2026, focused on interoperable agent identity and authorization. Microsoft is extending Entra — their identity management platform — to become the control plane for non-human agents. Gartner predicts that 40% of AI agent projects will fail by 2027 specifically because organizations failed to implement proper agent identity governance.

The Model Context Protocol, developed by Anthropic and adopted across the industry, provides a standard for AI agents to connect to external tools and data sources — but it assumes agents have persistent identity and context. MCP without identity is just another way to give a stateless agent temporary access to tools it won't remember using next session.

The pattern is clear: the companies and standards bodies shaping the AI agent ecosystem have concluded that persistent identity isn't optional. It's the layer that makes everything else — tool use, memory, autonomous operation, team coordination — actually work.

## From Post-it Notes to Infrastructure

The system prompt era was necessary. It was how we learned to work with AI. But it was always a workaround — a temporary solution for a fundamental architectural gap.

The teams that will get the most value from AI agents aren't the ones writing better prompts. They're the ones building persistent identity into their AI infrastructure. They're defining who their agents are, what they know, what they can do, and where the boundaries are — once — and letting that identity compound across every interaction.

A Post-it note reminds you of something you might forget. Identity is something you carry with you. Your AI agents deserve the same distinction.

---

*Ready to move beyond system prompts? Lorebound provides the full identity stack — identity core, roles, lore, skills, and boundaries — so your AI agents carry your brand with them in every interaction. [Start building your identity layer](/signup).*`,
  },
]

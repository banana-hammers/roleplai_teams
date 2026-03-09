export function BlogHeader({
  title = 'Blog',
  description = 'Thoughts on AI identity, brand voice at scale, and building the future of AI agents.',
}: {
  title?: string
  description?: string
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
      <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {description}
        </p>
      </div>
    </section>
  )
}

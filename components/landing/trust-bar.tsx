export function TrustBar() {
  return (
    <section className="border-y border-border/40 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Trusted by teams building consistent AI identities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {/* Placeholder logos - replace with actual logos when available */}
            {["Company A", "Company B", "Company C", "Company D", "Company E"].map(
              (company) => (
                <div
                  key={company}
                  className="text-lg font-semibold text-muted-foreground/50"
                >
                  {company}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

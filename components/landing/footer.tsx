import Link from "next/link";

const footerLinks = {
  Product: [
    { name: "RoleplAIrs", href: "#roleplaIrs" },
    { name: "Missions", href: "#missions" },
  ],
  Company: [
    { name: "About", href: "/about" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-primary">
                Roleplai Teams
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              RoleplAIrs: AI agents that are extensions of you. One Identity
              Core. Infinite possibilities.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold">{category}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Roleplai Teams. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

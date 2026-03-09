import { Navbar } from '@/components/navigation'
import { Footer } from '@/components/landing/footer'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

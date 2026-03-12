'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Bot, Terminal, Sparkles } from 'lucide-react'
import type { Skill } from '@/lib/skills-types'
import type { Subagent } from '@/lib/subagents-types'
import type { Command } from '@/lib/commands-types'

interface HomePageClientProps {
  subagentCount: number
  commandCount: number
  skillCount: number
  featuredSkills: Skill[]
  featuredSubagents: Subagent[]
  featuredCommands: Command[]
}

const words = ['skills', 'tools', 'agents']

interface FeaturedSectionProps {
  title: string
  href: string
  icon: React.ElementType
  color: 'yellow' | 'blue' | 'green'
  items: Array<{ name?: string; slug: string; description: string }>
  itemLinkPrefix: string
}

function FeaturedSection({ title, href, icon: Icon, color, items, itemLinkPrefix }: FeaturedSectionProps) {
  const colorClasses = {
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-display-3 flex items-center gap-3">
            <Icon className={`h-7 w-7 ${colorClasses[color]}`} />
            {title}
          </h2>
          <Link href={href} className="text-sm text-muted-foreground hover:text-accent transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link key={item.slug} href={`${itemLinkPrefix}/${item.slug}`}>
              <div className="p-6 rounded-lg border border-border hover:border-primary/40 transition-colors h-full">
                <h3 className="font-medium mb-2">{item.name || item.slug}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePageClient({
  subagentCount,
  commandCount,
  skillCount,
  featuredSkills,
  featuredSubagents,
  featuredCommands,
}: HomePageClientProps) {
  const [wordIndex, setWordIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length)
        setIsVisible(true)
      }, 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const categories = [
    { href: '/skills', label: 'Skills', count: skillCount, icon: Sparkles, color: 'yellow' as const },
    { href: '/subagents', label: 'Subagents', count: subagentCount, icon: Bot, color: 'blue' as const },
    { href: '/commands', label: 'Commands', count: commandCount, icon: Terminal, color: 'green' as const },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-xl">
            <h1 className="text-display-1 mb-8">
              Extend Claude with curated{' '}
              <span
                className={`text-[#e89a7a] inline-block transition-all duration-200 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                }`}
              >
                {words[wordIndex]}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              A collection of {subagentCount + commandCount + skillCount}+ practical extensions
              to enhance your productivity with Claude Code.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/skills">
                <Button size="lg" className="btn-primary gap-2">
                  Browse Skills <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by type */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground mb-8 text-center tracking-wide uppercase">
            Browse by type
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {categories.map((cat) => {
              const Icon = cat.icon
              const colorClasses = {
                blue: 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20',
                green: 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20',
                yellow: 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20',
              }
              return (
                <Link key={cat.href} href={cat.href}>
                  <div className="p-6 rounded-lg border border-border hover:border-primary/40 transition-all group text-center">
                    <div className={`w-12 h-12 rounded-full ${colorClasses[cat.color]} flex items-center justify-center mx-auto mb-4 transition-colors`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-serif text-foreground mb-1">
                      {cat.count}
                    </div>
                    <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {cat.label}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      <FeaturedSection
        title="Skills"
        href="/skills"
        icon={Sparkles}
        color="yellow"
        items={featuredSkills}
        itemLinkPrefix="/skill"
      />

      {/* Featured Subagents */}
      <FeaturedSection
        title="Subagents"
        href="/subagents"
        icon={Bot}
        color="blue"
        items={featuredSubagents}
        itemLinkPrefix="/subagent"
      />

      {/* Featured Commands */}
      <FeaturedSection
        title="Commands"
        href="/commands"
        icon={Terminal}
        color="green"
        items={featuredCommands}
        itemLinkPrefix="/command"
      />
    </div>
  )
}

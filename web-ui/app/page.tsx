import { getAllSubagents } from '@/lib/subagents-server'
import { getAllCommands } from '@/lib/commands-server'
import { getAllSkills } from '@/lib/skills-server'
import HomePageClient from './page-client'

export default async function Home() {
  const [subagents, commands, skills] = await Promise.all([
    getAllSubagents(),
    getAllCommands(),
    getAllSkills(),
  ])

  return (
    <HomePageClient
      subagentCount={subagents.length}
      commandCount={commands.length}
      skillCount={skills.length}
      featuredSkills={skills.slice(0, 8)}
      featuredSubagents={subagents.slice(0, 8)}
      featuredCommands={commands.slice(0, 8)}
    />
  )
}

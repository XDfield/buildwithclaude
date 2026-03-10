import { getAllSubagents } from '@/lib/subagents-server'
import { getAllCommands } from '@/lib/commands-server'
import { getAllPlugins } from '@/lib/plugins-server'
import { getAllSkills } from '@/lib/skills-server'
import { getAllHooks } from '@/lib/hooks-server'
import HomePageClient from './page-client'

export default async function Home() {
  const plugins = getAllPlugins()
  const [subagents, commands, skills, hooks] = await Promise.all([
    getAllSubagents(),
    getAllCommands(),
    getAllSkills(),
    getAllHooks(),
  ])

  return (
    <HomePageClient
      pluginCount={plugins.length}
      subagentCount={subagents.length}
      commandCount={commands.length}
      skillCount={skills.length}
      hookCount={hooks.length}
      featuredPlugins={plugins.slice(0, 8)}
      featuredSkills={skills.slice(0, 8)}
      featuredSubagents={subagents.slice(0, 8)}
      featuredCommands={commands.slice(0, 8)}
      featuredHooks={hooks.slice(0, 8)}
    />
  )
}

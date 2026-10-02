'use client'

import {
  createContext,
  useContext,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabContext = createContext<((value: string) => void) | null>(null)

/** Lets a section switch to another tab, e.g. a button that opens Upload */
export function useDashboardTab() {
  return useContext(TabContext)
}

export interface ShellItem {
  value: string
  label: string
  icon: ComponentType<{ className?: string }>
  content: ReactNode
}

/**
 * Dashboard layout used by both roles: a left navigation block (a scrolling
 * strip on phones) beside the active section. Built on Radix Tabs so keyboard
 * navigation and ARIA roles come for free.
 */
export default function DashboardShell({
  items,
  defaultValue,
  heading,
  name,
}: {
  items: ShellItem[]
  defaultValue: string
  /** Small label above the menu, e.g. "Manage" */
  heading: string
  /** Name of the signed-in user, shown at the top of the menu */
  name: string
}) {
  const [tab, setTab] = useState(defaultValue)

  return (
    <TabContext.Provider value={setTab}>
      <Tabs
        value={tab}
        onValueChange={setTab}
        orientation="vertical"
        className="grid grid-cols-1 gap-5 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-6"
      >
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="mb-3 hidden rounded-lg border bg-card px-4 py-3 md:block">
            <p className="label-mono">{heading}</p>
            <p className="mt-0.5 truncate font-semibold" title={name}>
              {name}
            </p>
          </div>
          <TabsList
            aria-label={heading}
            className="flex h-auto w-full flex-row justify-start gap-1 overflow-x-auto rounded-lg border bg-card p-2 md:flex-col md:items-stretch md:justify-start"
          >
            {items.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex-none justify-start px-3 py-2.5 md:w-full"
              >
                <Icon className="size-[18px]" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </aside>

        <div className="min-w-0">
          {items.map(({ value, content }) => (
            <TabsContent
              key={value}
              value={value}
              className="flex flex-col gap-5"
            >
              {content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </TabContext.Provider>
  )
}

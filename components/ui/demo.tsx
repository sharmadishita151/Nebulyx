"use client"

import * as React from "react"
import EtchedAccretion from "@/components/ui/etched-accretion"
import { Flame, Sparkles, Compass } from "lucide-react"

export default function Demo() {
  return (
    // w-full matters: centres demos in a flex wrapper, and a flex item at
    // width:auto shrinks to its contents — which for a canvas is 0px.
    <div className="relative w-full overflow-hidden bg-[#040206]">
      <EtchedAccretion preset="combustion">
        <div className="pointer-events-none flex h-full flex-col justify-between p-6 text-white sm:p-12">
          {/* Top navigation / project pill */}
          <div className="pointer-events-auto flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-black/40 px-3 py-1.5 backdrop-blur-md">
              <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider text-orange-200">
                Ignis Atelier · Freefall Fire Lab
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-zinc-500" /> WebGL2 Procedural
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" /> Zero Textures
              </span>
            </div>
          </div>

          {/* Hero headline with combustion theme */}
          <div className="max-w-xl">
            <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              Where fire burns in{" "}
              <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-amber-300">
                freefall
              </span>
              .
            </h1>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em] text-orange-200/60">
              move to drift · hold to feed the core
            </p>
          </div>
        </div>
      </EtchedAccretion>
    </div>
  )
}

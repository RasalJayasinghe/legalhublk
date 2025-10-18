import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface HeroSectionDarkProps extends React.HTMLAttributes<HTMLDivElement> {
  onApplyClick?: () => void
  onLearnMoreClick?: () => void
}

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.3,
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`,
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,rgba(114,9,183,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(114,9,183,0.3)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0628] to-transparent to-90%" />
    </div>
  )
}

const HeroSectionDark = React.forwardRef<HTMLDivElement, HeroSectionDarkProps>(
  ({ className, onApplyClick, onLearnMoreClick, ...props }, ref) => {
    return (
      <div className={cn("relative", className)} ref={ref} {...props}>
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D0628] via-[#1a0d3d] to-[#7209B7] overflow-hidden">
          {/* Blurred gradient rings */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
          
          {/* Background icons at 5% opacity */}
          <div className="absolute inset-0 overflow-hidden opacity-5">
            <div className="absolute top-1/4 left-1/4 text-8xl">⚖️</div>
            <div className="absolute top-1/3 right-1/3 text-7xl">📄</div>
            <div className="absolute bottom-1/3 left-1/3 text-9xl">🔍</div>
            <div className="absolute bottom-1/4 right-1/4 text-6xl">⚖️</div>
            <div className="absolute top-1/2 right-1/2 text-7xl">📄</div>
          </div>
        </div>

        {/* Retro Grid */}
        <RetroGrid />

        {/* Content */}
        <section className="relative z-10 max-w-full mx-auto">
          <div className="max-w-screen-xl mx-auto px-4 py-24 md:py-32 lg:py-40">
            <div className="space-y-8 max-w-4xl mx-auto text-center">
              {/* Animated glow behind heading */}
              <div className="relative">
                <div className="absolute inset-0 blur-3xl opacity-30 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400" />
                </div>
                
                {/* Main heading */}
                <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
                  <span className="block mb-2">Partner with LegalHub</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-purple-200 to-pink-300">
                    Empower the Future of Legal Research
                  </span>
                </h1>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                {/* Primary button with gradient */}
                <Button
                  size="lg"
                  onClick={onApplyClick}
                  className="relative overflow-hidden bg-gradient-to-r from-[#7209B7] to-[#3A0CA3] hover:from-[#8a0ad9] hover:to-[#4a0ec7] text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 group"
                >
                  <span className="relative z-10">Apply to Partner</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </Button>

                {/* Secondary button with outline */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onLearnMoreClick}
                  className="bg-transparent border-2 border-white/80 text-white hover:bg-white/10 hover:border-white font-semibold px-8 py-6 text-lg backdrop-blur-sm transition-all duration-300"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  },
)
HeroSectionDark.displayName = "HeroSectionDark"

export { HeroSectionDark }

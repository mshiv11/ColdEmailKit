import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next/types"
import { Button } from "~/components/common/button"
import { Card } from "~/components/common/card"
import { Container } from "~/components/web/ui/container"
import { Icon } from "~/components/common/icon"
import { findAd } from "~/server/web/ads/queries"
import { siteConfig } from "~/config/site"
import { metadataConfig } from "~/config/metadata"

export const metadata: Metadata = {
  title: `Featured Sponsor – ${siteConfig.name}`,
  description: `Learn more about our premium featured partners and tools on ${siteConfig.name}.`,
  openGraph: { ...metadataConfig.openGraph, url: "/advertisement" },
  alternates: { ...metadataConfig.alternates, canonical: "/advertisement" },
}

export default async function AdvertisementPage() {
  // Fetch the latest active advertisement of any type
  const ad = await findAd({})

  if (!ad) {
    return (
      <Container className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full p-8 text-center border border-dashed border-neutral-800 bg-neutral-950/40 backdrop-blur-md rounded-2xl">
          <Icon name="lucide/circle-x" className="size-12 mx-auto text-neutral-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Active Promotion</h2>
          <p className="text-neutral-400 text-sm mb-6">
            There is currently no active featured advertisement. Interested in promoting your brand here?
          </p>
          <Button variant="primary" asChild className="w-full">
            <a href="/advertise">Advertise with us</a>
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container className="relative flex items-center justify-center min-h-[70vh] py-12 overflow-clip">
      {/* Dynamic Ambient Mesh Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none select-none opacity-60 animate-pulse" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 -z-10 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[90px] pointer-events-none select-none opacity-40" />

      <Card className="relative max-w-xl w-full p-8 md:p-10 border border-neutral-800/80 bg-neutral-950/70 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-visible">
        
        {/* FAB View Icon (Sponsor favicon/logo showcased as a floating glowing action symbol at the top-center) */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="relative group">
            {/* Pulsing ring around the FAB */}
            <div className="absolute inset-0 bg-yellow-500/30 rounded-2xl blur-md group-hover:bg-yellow-500/50 transition-all duration-300 animate-ping opacity-75" />
            
            <div className="relative size-20 rounded-2xl bg-neutral-900 border-2 border-yellow-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 overflow-clip p-3">
              {ad.faviconUrl ? (
                <Image
                  src={ad.faviconUrl}
                  alt={ad.name}
                  width={64}
                  height={64}
                  className="size-full object-contain"
                />
              ) : (
                <Icon name="lucide/sparkles" className="size-8 text-yellow-500" />
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-12 flex flex-col gap-6">
          <span className="self-center inline-flex items-center gap-1 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-xs font-semibold tracking-wide uppercase">
            <Icon name="lucide/sparkles" className="size-3.5" /> Featured Sponsor
          </span>

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {ad.name}
            </h1>
            
            <div className="h-0.5 w-16 bg-gradient-to-r from-yellow-500 to-transparent mx-auto rounded-full" />
          </div>

          <p className="text-neutral-300 text-base md:text-lg leading-relaxed max-w-md mx-auto">
            {ad.description}
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-neutral-950 font-bold py-3.5 text-base border-none rounded-xl shadow-[0_4px_20px_rgba(234,179,8,0.2)] hover:shadow-[0_4px_25px_rgba(234,179,8,0.4)] transition-all duration-300"
              asChild
            >
              <a href={ad.websiteUrl} target="_blank" rel="noopener noreferrer">
                {ad.buttonLabel ?? `Visit ${ad.name}`} <Icon name="lucide/arrow-up-right" className="size-4 ml-1.5 inline" />
              </a>
            </Button>

            <span className="text-neutral-500 text-xs tracking-wider">
              Redirects securely to verified sponsor domain
            </span>
          </div>
        </div>
      </Card>
    </Container>
  )
}

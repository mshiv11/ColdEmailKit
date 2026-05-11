"use client"

import { isExternalUrl } from "@primoui/utils"
import { type Properties, posthog } from "posthog-js"
import type { ComponentProps } from "react"
import { siteConfig } from "~/config/site"
import { getUrlHostname } from "~/utils/helpers"
import { addSearchParams } from "~/utils/search-params"

type ExternalLinkProps = ComponentProps<"a"> & {
  doTrack?: boolean
  doFollow?: boolean
  eventName?: string
  eventProps?: Properties
}

export const ExternalLink = ({
  href,
  target = "_blank",
  doTrack = true,
  doFollow = false,
  eventName,
  eventProps,
  ...props
}: ExternalLinkProps) => {
  const hostname = getUrlHostname(siteConfig.url)
  const addTracking = doTrack && !href?.includes("utm_")
  const finalHref = addTracking ? addSearchParams(href!, { utm_source: hostname }) : href
  const isExternal = isExternalUrl(finalHref)

  const isAffiliate =
    finalHref?.includes("go.coldemailkit.com") || finalHref?.includes("coldemailkit.com/go")
  const rel = [`noopener`]
  if (isAffiliate) {
    rel.push("nofollow", "sponsored")
  } else if (!doFollow) {
    rel.push("nofollow")
  }

  return (
    <a
      href={finalHref!}
      target={target}
      rel={rel.join(" ")}
      onClick={() => isExternal && eventName && posthog.capture(eventName, eventProps)}
      {...props}
    />
  )
}

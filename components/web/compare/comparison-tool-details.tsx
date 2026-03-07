import { formatNumber, isTruthy } from "@primoui/utils"
import type { ComponentProps } from "react"
import { Card } from "~/components/common/card"
import { H5 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Insights } from "~/components/web/ui/insights"
import type { ComparisonTool } from "~/server/web/comparisons/payloads"
import { cx } from "~/utils/cva"

type ComparisonToolDetailsProps = ComponentProps<"div"> & {
  tool: ComparisonTool
}

export const ComparisonToolDetails = ({ className, tool, ...props }: ComparisonToolDetailsProps) => {
  const insights = [
    {
      label: "Overall rating",
      value: tool.overallRating ?? 0,
      icon: <Icon name="lucide/star" />,
    },
    {
      label: "Total reviews",
      value: formatNumber(tool.totalReviews ?? 0, "standard"),
      icon: <Icon name="lucide/users" />,
    },
    {
      label: "Trust Score",
      value: `${tool.trustScore ?? 0}%`,
      icon: <Icon name="lucide/shield" />,
    },
    tool.pricingStarting
      ? {
          label: "Starting Price",
          value: tool.pricingStarting,
          icon: <Icon name="lucide/dollar-sign" />,
        }
      : undefined,
    tool.bestFor
      ? {
          label: "Best for",
          value: tool.bestFor.replaceAll(",", ", "),
          icon: <Icon name="lucide/briefcase" />,
        }
      : undefined,
    tool.isSelfHosted
      ? {
          label: "Self-hosted",
          value: "Yes",
          icon: <Icon name="lucide/server" />,
        }
      : undefined,
  ]

  return (
    <Card
      hover={false}
      focus={false}
      className={cx("items-stretch bg-transparent", className)}
      {...props}
    >
      <H5 as="strong">Details:</H5>
      <Insights insights={insights.filter(isTruthy)} className="text-sm" />
    </Card>
  )
}

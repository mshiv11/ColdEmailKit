"use client"

import type { Ad } from "@prisma/client"
import { usePathname, useRouter } from "next/navigation"
import { type ComponentProps, useState } from "react"
import { AdsDeleteDialog } from "./ads-delete-dialog"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { cx } from "~/utils/cva"

type AdActionsProps = ComponentProps<typeof Button> & {
  ad: Ad
}

export const AdActions = ({ ad, className, ...props }: AdActionsProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open menu"
          variant="secondary"
          size="sm"
          prefix={<Icon name="lucide/ellipsis" />}
          className={cx("data-[state=open]:bg-accent", className)}
          {...props}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {pathname !== `/admin/ads/${ad.id}` && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/ads/${ad.id}`}>Edit</Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href={ad.websiteUrl} target="_blank">
            Visit URL
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => setIsDeleteOpen(true)} className="text-red-500">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>

      <AdsDeleteDialog
        ads={[ad]}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        showTrigger={false}
        onSuccess={() => {
          setIsDeleteOpen(false)
          if (pathname.includes(ad.id)) {
            router.push("/admin/ads")
          }
        }}
      />
    </DropdownMenu>
  )
}

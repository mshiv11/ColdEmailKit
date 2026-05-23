"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { type ComponentProps } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useServerAction } from "zsa-react"
import { AdActions } from "./ad-actions"
import { Button } from "~/components/common/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/common/form"
import { H3 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Input } from "~/components/common/input"
import { Link } from "~/components/common/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { Checkbox } from "~/components/common/checkbox"
import { upsertAd } from "~/server/admin/ads/actions"
import { adFormSchema, type AdFormSchema } from "~/server/admin/ads/schema"
import { cx } from "~/utils/cva"
import type { Ad } from "@prisma/client"
import { AdType } from "@prisma/client"
import { generateFavicon } from "~/actions/media"
import { getRandomString, isValidUrl } from "@primoui/utils"

type AdFormProps = ComponentProps<"form"> & {
  ad?: Ad | null
  title: string
}

const AD_TYPE_LABELS: Record<AdType, string> = {
  [AdType.Banner]: "Mid-Page Banner",
  [AdType.Alternatives]: "Alternatives Category Sidebar",
  [AdType.AlternativePage]: "Alternative Details Sidebar",
  [AdType.Tools]: "Tools Directory Sidebar",
  [AdType.ToolPage]: "Tool Details Sidebar (Side Banner)",
  [AdType.SelfHosted]: "Self-Hosted Directory Sidebar",
  [AdType.BlogPost]: "Blog Page Sidebar",
  [AdType.All]: "Show Everywhere (All Positions)",
  [AdType.TopBar]: "Top-Bar Banner (Deprecated)",
}

const TARGET_PAGES = [
  { id: "home", label: "Home Page (/)" },
  { id: "category", label: "Category Pages (/categories/*)" },
  { id: "tool", label: "Tool Detail Pages (/tools/*)" },
  { id: "blog", label: "Blog Pages (/blog/*)" },
  { id: "alternatives", label: "Alternatives Pages (/alternatives/*)" },
]

export function AdForm({ children, className, title, ad, ...props }: AdFormProps) {
  const router = useRouter()

  const defaultStartsAt = ad?.startsAt ? new Date(ad.startsAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  const defaultEndsAt = ad?.endsAt ? new Date(ad.endsAt).toISOString().slice(0, 16) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)

  const form = useForm<AdFormSchema>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      name: ad?.name ?? "",
      description: ad?.description ?? "",
      websiteUrl: ad?.websiteUrl ?? "",
      faviconUrl: ad?.faviconUrl ?? "",
      buttonLabel: ad?.buttonLabel ?? "Learn More",
      type: ad?.type ?? AdType.Banner,
      displayPages: ad?.displayPages ?? ["home"],
      startsAt: defaultStartsAt as any,
      endsAt: defaultEndsAt as any,
      email: ad?.email ?? "admin@coldemailkit.com",
    },
  })

  const websiteUrl = form.watch("websiteUrl")

  // Generate favicon
  const faviconAction = useServerAction(generateFavicon, {
    onSuccess: ({ data }) => {
      toast.success("Favicon successfully generated. Please save the advertisement to update.")
      form.setValue("faviconUrl", data)
    },
    onError: ({ err }) => toast.error(err.message),
  })

  const upsertAction = useServerAction(upsertAd, {
    onSuccess: () => {
      toast.success(`Advertisement successfully ${ad ? "updated" : "created"}`)
      router.push("/admin/ads")
      router.refresh()
    },
    onError: ({ err }) => toast.error(err.message),
  })

  const handleSubmit = form.handleSubmit(data => {
    upsertAction.execute({ ...data, id: ad?.id })
  })

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          {ad && <AdActions ad={ad} size="md" />}
        </Stack>
      </Stack>

      <form
        onSubmit={handleSubmit}
        className={cx("grid gap-4 @sm:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Title (Name)</FormLabel>
              <FormControl>
                <Input placeholder="Enter advertisement title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <TextArea placeholder="Enter a highly engaging short description..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="faviconUrl"
          render={({ field }) => (
            <FormItem className="items-stretch col-span-full">
              <Stack className="justify-between">
                <FormLabel className="flex-1">Favicon URL</FormLabel>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  prefix={
                    <Icon
                      name="lucide/refresh-cw"
                      className={cx(faviconAction.isPending && "animate-spin")}
                    />
                  }
                  className="-my-1"
                  disabled={!isValidUrl(websiteUrl) || faviconAction.isPending}
                  onClick={() => {
                    faviconAction.execute({
                      url: websiteUrl,
                      path: `ads/${getRandomString(12)}`,
                    })
                  }}
                >
                  {field.value ? "Regenerate" : "Generate"}
                </Button>
              </Stack>

              <Stack size="sm">
                {field.value && (
                  <img
                    src={field.value}
                    alt="Favicon Preview"
                    className="size-8 border box-content rounded-md object-contain p-0.5 bg-background"
                    onError={(e) => {
                      e.currentTarget.src = "/favicon.png"
                    }}
                  />
                )}
                <FormControl>
                  <Input placeholder="Leave empty to use website favicon" {...field} value={field.value ?? ""} />
                </FormControl>
              </Stack>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position Type</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select placement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AdType)
                      .filter(t => t !== AdType.TopBar)
                      .map(t => (
                        <SelectItem key={t} value={t}>
                          {AD_TYPE_LABELS[t] || t}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="buttonLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Button Label</FormLabel>
              <FormControl>
                <Input placeholder="Learn More" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starts At</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} value={field.value as any} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ends At</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} value={field.value as any} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Sponsor Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="advertiser@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayPages"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Target Pages</FormLabel>
              <div className="grid gap-2 sm:grid-cols-2 mt-2 border rounded-md p-3 bg-card/50">
                {TARGET_PAGES.map(page => {
                  const isChecked = field.value?.includes(page.id)
                  return (
                    <div key={page.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`page-${page.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const val = field.value || []
                          if (checked) {
                            field.onChange([...val, page.id])
                          } else {
                            field.onChange(val.filter(v => v !== page.id))
                          }
                        }}
                      />
                      <label htmlFor={`page-${page.id}`} className="text-sm font-medium leading-none cursor-pointer">
                        {page.label}
                      </label>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Select the pages where this advertisement banner should be displayed.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full mt-4">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/ads">Cancel</Link>
          </Button>

          <Button size="md" isPending={upsertAction.isPending}>
            {ad ? "Update advertisement" : "Create advertisement"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coldemailkit.com"

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/auth/",
        "/dashboard/",
        "/submit-tool/",
        "/api/",
        "/*?sort=",
        "/*?page=",
        "/*?ref=",
        "/*?q=",
        "/*?alternative=",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

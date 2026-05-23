import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
  unstable_allowDynamic: ["**/node_modules/better-call/**", "**/node_modules/better-auth/**"],
}

export default async function (req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const sessionCookie = getSessionCookie(req)

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-current-path", pathname)

  // If the user is logged in and tries to access the auth page, redirect to the home page
  if (sessionCookie && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", req.url), {
      headers: requestHeaders,
    })
  }

  // If the user is not logged in and tries to access the authed pages, redirect to the login page
  if (!sessionCookie && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL(`/auth/login?next=${pathname}${search}`, req.url))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuth = !!user
  const path = request.nextUrl.pathname
  const isAdminPath = path.startsWith('/admin')
  const isAdminAuthPage = path === '/admin/login' || path === '/admin/signup'
  const isAdminPendingPage = path === '/admin/pendente'
  const isAuthPage = path.startsWith('/login') || path.startsWith('/signup')
  const isOnboarding = path.startsWith('/onboarding')

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (isAdminPath) {
    if (isAdminAuthPage) {
      // If already logged in with trainer/admin role, skip login
      if (isAuth) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (p?.role === 'admin' || p?.role === 'trainer') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      }
      return supabaseResponse
    }

    if (!isAuth) return NextResponse.redirect(new URL('/admin/login', request.url))

    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = p?.role ?? 'user'

    if (role === 'trainer_pending' && !isAdminPendingPage) {
      return NextResponse.redirect(new URL('/admin/pendente', request.url))
    }

    if (role !== 'admin' && role !== 'trainer' && role !== 'trainer_pending') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return supabaseResponse
  }

  // ── Regular app routes ───────────────────────────────────────────────────────
  if (!isAuth && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isAuth && !isAuthPage && !isOnboarding) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('objetivo, role')
      .eq('id', user.id)
      .single()

    // Skip onboarding for admin/trainer accounts
    const role = (profile as { objetivo?: string | null; role?: string } | null)?.role ?? 'user'
    if (!profile?.objetivo && role === 'user') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

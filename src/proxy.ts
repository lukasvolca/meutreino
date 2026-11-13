import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ONB_COOKIE = 'mt_onb'

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

  // getClaims() valida o JWT localmente (e renova a sessão se precisar),
  // sem ir ao servidor de auth em toda navegação.
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims?.sub ? { id: claimsData.claims.sub } : null

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
        if (['admin', 'trainer', 'nutritionist'].includes(p?.role ?? '')) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      }
      return supabaseResponse
    }

    if (!isAuth) return NextResponse.redirect(new URL('/admin/login', request.url))

    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = p?.role ?? 'user'

    if ((role === 'trainer_pending' || role === 'nutritionist_pending') && !isAdminPendingPage) {
      return NextResponse.redirect(new URL('/admin/pendente', request.url))
    }

    if (!['admin', 'trainer', 'nutritionist', 'trainer_pending', 'nutritionist_pending'].includes(role)) {
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

  // Onboarding concluído fica marcado num cookie (amarrado ao id do usuário),
  // então o perfil só é consultado até a primeira confirmação.
  if (isAuth && !isAuthPage && !isOnboarding && request.cookies.get(ONB_COOKIE)?.value !== user.id) {
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
    if (profile) {
      supabaseResponse.cookies.set(ONB_COOKIE, user.id, {
        httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 365,
      })
    }
  }

  return supabaseResponse
}

export const config = {
  // sw.js e manifest.json precisam ser servidos sem login (senão o service
  // worker é redirecionado e o navegador recusa o registro).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)'],
}

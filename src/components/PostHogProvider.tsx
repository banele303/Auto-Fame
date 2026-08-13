'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // 'always' = track ALL visitors including anonymous ones (was 'identified_only' — that's why everything showed 0)
    person_profiles: 'always',
    capture_pageview: false, // We fire $pageview manually via PostHogPageView so we control the URL
    capture_pageleave: true, // Track when users leave so session duration is accurate
    autocapture: true,       // Capture clicks, form submissions etc automatically
  })
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}

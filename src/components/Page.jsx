import { useEffect } from 'react'
import { usePageTitle } from '../hooks.js'

/**
 * Wraps a routed page so it sets the document title on mount and returns the
 * document to scroll-top focus when a new page is pushed onto the history.
 *
 * Scrolling is deliberately instant: base.css sets `scroll-behavior: smooth` for
 * in-page anchors, and animating a full-page jump reads as a laggy transition.
 */
export default function Page({ title, children }) {
  usePageTitle(title)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [title])

  return children
}
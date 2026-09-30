import { useEffect, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'
import { DURATION, EASING, isReducedMotion } from './tokens.js'

/**
 * useAnime - React hook for executing Anime.js animations with lifecycle safety
 */
export function useAnime(callback, deps = []) {
  const ref = useRef(null)
  
  useEffect(() => {
    if (isReducedMotion()) return
    const anim = callback(ref.current)
    return () => {
      if (anim && typeof anim.pause === 'function') {
        anim.pause()
      }
    }
  }, deps)

  return ref
}

/**
 * useCountUpNumber - Animates a numerical counter smoothly using Anime.js
 */
export function useCountUpNumber(targetValue, { duration = DURATION.slow, decimals = 0 } = {}) {
  const [displayValue, setDisplayValue] = useState(targetValue)
  const animTarget = useRef({ val: Number(targetValue) || 0 })
  const prevValue = useRef(Number(targetValue) || 0)

  useEffect(() => {
    const num = Number(targetValue)
    if (isNaN(num)) {
      setDisplayValue(targetValue)
      return
    }

    if (isReducedMotion()) {
      setDisplayValue(decimals > 0 ? num.toFixed(decimals) : String(Math.round(num)))
      return
    }

    const obj = animTarget.current
    obj.val = prevValue.current

    const anim = animate(obj, {
      val: num,
      duration,
      ease: EASING.appleSmooth,
      onUpdate: () => {
        setDisplayValue(decimals > 0 ? obj.val.toFixed(decimals) : String(Math.round(obj.val)))
      },
      onComplete: () => {
        prevValue.current = num
        setDisplayValue(decimals > 0 ? num.toFixed(decimals) : String(Math.round(num)))
      },
    })

    return () => {
      if (anim && typeof anim.pause === 'function') {
        anim.pause()
      }
    }
  }, [targetValue, duration, decimals])

  return displayValue
}

/**
 * useStaggerEntrance - Staggered reveal for child elements with .motion-item class
 */
export function useStaggerEntrance({ selector = '.motion-item', delay = 50, duration = DURATION.base } = {}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || isReducedMotion()) return

    const items = containerRef.current.querySelectorAll(selector)
    if (!items.length) return

    animate(items, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration,
      delay: stagger(delay, { start: 60 }),
      ease: EASING.appleSmooth,
    })
  }, [selector, delay, duration])

  return containerRef
}

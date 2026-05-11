import { useEffect, useRef } from 'react'

export function useLockBodyScroll(isLocked: boolean) {
  const scrollYRef = useRef(0)

  useEffect(() => {
    if (!isLocked) {
      return
    }

    const { body, documentElement } = document
    const previousBodyStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    const previousHtmlOverflow = documentElement.style.overflow

    scrollYRef.current = window.scrollY

    documentElement.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollYRef.current}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    return () => {
      documentElement.style.overflow = previousHtmlOverflow
      body.style.position = previousBodyStyle.position
      body.style.top = previousBodyStyle.top
      body.style.left = previousBodyStyle.left
      body.style.right = previousBodyStyle.right
      body.style.width = previousBodyStyle.width
      body.style.overflow = previousBodyStyle.overflow

      window.scrollTo(0, scrollYRef.current)
    }
  }, [isLocked])
}

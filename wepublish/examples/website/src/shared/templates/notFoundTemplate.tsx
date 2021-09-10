import React, {useRef, useEffect} from 'react'
import {useStyle, cssRule} from '@karma.run/react'
import {pxToRem, hexToRgb, whenDesktop} from '../style/helpers'
import {Color} from '../style/colors'

export const NotFoundTemplateContentStyle = cssRule({
  padding: pxToRem(20),
  backgroundColor: Color.Error,
  height: '100%',
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',

  '::before': {
    content: '""',
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    background: `radial-gradient(ellipse at center, rgba(${hexToRgb(
      Color.Secondary
    )},1) 0%, rgba(${hexToRgb(Color.Secondary)},0) 100%)`,
    pointerEvents: 'none'
  }
})

const NotFoundTemplateTitleStyle = cssRule({
  color: Color.White,
  fontSize: pxToRem(100),
  zIndex: 1,

  ...whenDesktop({
    fontSize: pxToRem(150)
  })
})

const NotFoundTemplateCanvasStyle = cssRule({
  height: '100%',
  width: '100%',
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: 1
})

export interface NotFoundTemplateProps {
  readonly statusCode?: number
}

function throttle(func: Function, limit: number) {
  let inThrottle: boolean
  return function (this: any) {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function NotFoundTemplate({statusCode = 404, ...props}: NotFoundTemplateProps) {
  const css = useStyle()
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let mousePositionX: number = 0
    let icons: any[] = []
    let isRunning = true

    const canvas = ref.current
    const context = canvas ? canvas.getContext('2d') : null

    const throttledFunc = throttle((e: MouseEvent) => {
      // parallax effect
      mousePositionX = (e.clientX / window.innerWidth) * 100 - 50
    }, 20)

    function updateCanvasSize() {
      if (canvas) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }
    }

    window.addEventListener('mousemove', throttledFunc)
    window.addEventListener('resize', updateCanvasSize)

    updateCanvasSize()

    function update() {
      generateIcons(canvas, context)
      makeItRain(canvas, context)

      // animation frame
      if (isRunning) requestAnimationFrame(update)
    }

    requestAnimationFrame(update)

    function generateIcons(canvas: any, context: any) {
      const iconList = ['cam', 'car', 'crown', 'icecream', 'stadium', 'wine']

      if (icons.length < 40) {
        let image = new Image()
        image.src = `/static/icons/${iconList[randomIntFromInterval(0, 5)]}.png`

        const xOffset = randomIntFromInterval(1, 99)
        const yOffset = randomIntFromInterval(-200, 0)
        const size = randomIntFromInterval(3, 6) * 15

        icons.push({
          image: image,
          xOffset: xOffset,
          yOffset: yOffset,
          size: size,
          imageIndex: randomIntFromInterval(0, 100000000)
        })
      }
    }

    function makeItRain(canvas: any, context: any) {
      // clear image
      context.clearRect(0, 0, canvas.width, canvas.height)
      icons.forEach(elem => {
        if (context) {
          const xOffset = (canvas.width / 100) * elem.xOffset - (mousePositionX * elem.size) / 100
          const yOffset = (canvas.height / 100) * elem.yOffset
          let size = elem.size

          // check size
          if (canvas.width < 700) {
            size = elem.size / 2
          } else if (canvas.width < 1000) {
            size = elem.size / 1.5
          }

          // redraw image
          elem.yOffset += size / 300
          context.drawImage(elem.image, xOffset, yOffset, size, size)

          // remove image if out of view and generate new one
          if (yOffset > canvas.height) {
            icons = icons.filter(obj => {
              return obj.imageIndex !== elem.imageIndex
            })

            generateIcons(canvas, context)
          }
        }
      })
    }

    return () => {
      isRunning = false
      window.removeEventListener('mousemove', throttledFunc)
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])

  return (
    <div className={css(NotFoundTemplateContentStyle)}>
      <canvas ref={ref} className={css(NotFoundTemplateCanvasStyle)}></canvas>
      <h1 className={css(NotFoundTemplateTitleStyle)}>{statusCode}</h1>
    </div>
  )
}

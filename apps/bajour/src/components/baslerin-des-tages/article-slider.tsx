// Slider.tsx
import React, {useState, useEffect, ComponentType} from 'react'
import './Slider.css'

interface SliderProps<T> {
  data: T[]
  children: ComponentType<{item: T}>
}

export function Slider<T>({data, children: WrappedComponent}: SliderProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [translateValue, setTranslateValue] = useState(0)

  useEffect(() => {
    const slideWidth = document.querySelector('.slide')?.clientWidth || 0
    setTranslateValue(-currentIndex * slideWidth)
  }, [currentIndex])

  const goToPrevSlide = () => {
    if (currentIndex === 0) {
      setCurrentIndex(data.length - 1)
    } else {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNextSlide = () => {
    if (currentIndex === data.length - 1) {
      setCurrentIndex(0)
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <div className="slider-container">
      <div
        className="slider-wrapper"
        style={{
          transform: `translateX(${translateValue}px)`,
          transition: 'transform ease-out 0.45s'
        }}>
        {data.map((item, index) => (
          <div className="slide" key={index}>
            <WrappedComponent item={item} />
          </div>
        ))}
      </div>
      <button className="slider-button prev" onClick={goToPrevSlide}>
        Prev
      </button>
      <button className="slider-button next" onClick={goToNextSlide}>
        Next
      </button>
    </div>
  )
}

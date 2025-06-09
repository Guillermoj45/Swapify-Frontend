"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { IonIcon } from "@ionic/react"
import {arrowForward, arrowBack, diamond, home, trendingUp, flash} from "ionicons/icons"

interface SliderItem {
    id: number
    title: string
    description: string
    buttonText: string
    backgroundColor: string
    textColor: string
    buttonColor: string
    imageUrl: string
    icon: string
}

// Define types for slider ref
interface SliderRef extends HTMLDivElement {
    dataset: {
        touchStartX?: string
        touchStartScrollX?: string
    }
}

interface NormalSliderProps {
    darkMode: boolean
    onSliderButtonClick: (slideId: number) => void
}

const NormalSlider: React.FC<NormalSliderProps> = ({ darkMode, onSliderButtonClick }) => {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [sliderPaused, setSliderPaused] = useState(false)
    const sliderRef = useRef<SliderRef | null>(null)

    // Enhanced Slider items con categorías en lugar de productos
    const sliderItems: SliderItem[] = [
        {
            id: 1,
            title: "Beneficios Exclusivos Premium",
            description:
                "Accede a funciones avanzadas, analytics detallados y destaca tus productos con nuestro plan Premium.",
            buttonText: "Descubre Premium",
            backgroundColor: darkMode
                ? "linear-gradient(135deg, #1a3a63, #0f2541)"
                : "linear-gradient(135deg, #667eea, #764ba2)",
            textColor: "#ffffff",
            buttonColor: "#4facfe",
            imageUrl: "funcionalidad.png",
            icon: diamond,
        },
        {
            id: 2,
            title: "Vende 5x Más Rápido",
            description:
                "Con Premium, tus productos aparecen primero en búsquedas y tienes acceso a herramientas de promoción avanzadas.",
            buttonText: "Acelera tus Ventas",
            backgroundColor: darkMode
                ? "linear-gradient(135deg, #1e1a3a, #2a1a45)"
                : "linear-gradient(135deg, #f093fb, #f5576c)",
            textColor: "#ffffff",
            buttonColor: "#ff6b6b",
            imageUrl: "rapido.jpg",
            icon: trendingUp,
        },
        {
            id: 3,
            title: "Promoción Inteligente",
            description:
                "Usa IA para optimizar tus anuncios, llega a más compradores y maximiza tus ganancias automáticamente.",
            buttonText: "Suscríbete Ahora",
            backgroundColor: darkMode
                ? "linear-gradient(135deg, #3a1a2a, #45152a)"
                : "linear-gradient(135deg, #a8edea, #fed6e3)",
            textColor: "#ffffff",
            buttonColor: "#00d2ff",
            imageUrl: "IA.png",
            icon: flash,
        },
    ]


    // Functions to pause/resume the slider when the user interacts
    const pauseSlider = () => {
        setSliderPaused(true)
    }

    const resumeSlider = () => {
        setSliderPaused(false)
    }

    // Go to specific slide
    const goToSlide = (index: number) => {
        setCurrentSlide(index)
        if (sliderRef.current) {
            const scrollAmount = sliderRef.current.offsetWidth * index
            sliderRef.current.scrollTo({
                left: scrollAmount,
                behavior: "smooth",
            })
        }
        pauseSlider()
        setTimeout(resumeSlider, 5000)
    }

    // Handle manual scroll
    const handleScroll = () => {
        if (sliderRef.current) {
            const scrollPosition = sliderRef.current.scrollLeft
            const slideWidth = sliderRef.current.offsetWidth
            const newSlide = Math.round(scrollPosition / slideWidth)

            if (newSlide !== currentSlide && newSlide >= 0 && newSlide < sliderItems.length) {
                setCurrentSlide(newSlide)

                // Pause slider temporarily when user manually scrolls
                pauseSlider()
                setTimeout(resumeSlider, 5000)
            }
        }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        pauseSlider()

        // Store the initial touch position
        if (sliderRef.current) {
            sliderRef.current.dataset.touchStartX = e.touches[0].clientX.toString()
            sliderRef.current.dataset.touchStartScrollX = sliderRef.current.scrollLeft.toString()
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (sliderRef.current && sliderRef.current.dataset.touchStartX) {
            const touchStartX = Number.parseFloat(sliderRef.current.dataset.touchStartX)
            const touchStartScrollX = Number.parseFloat(sliderRef.current.dataset.touchStartScrollX || "0")
            const touchDiff = touchStartX - e.touches[0].clientX

            // Set scroll position directly for smoother swiping
            sliderRef.current.scrollLeft = touchStartScrollX + touchDiff
        }
    }

    const handleTouchEnd = () => {
        setTimeout(resumeSlider, 5000)

        // Clean up touch data
        if (sliderRef.current) {
            delete sliderRef.current.dataset.touchStartX
            delete sliderRef.current.dataset.touchStartScrollX
        }
    }

    // Effect to set up auto-scroll of slider
    useEffect(() => {
        let timer: number | null = null

        // Only set up the timer if not paused
        if (!sliderPaused) {
            timer = window.setInterval(() => {
                if (sliderItems.length > 0) {
                    setCurrentSlide((prev) => {
                        const nextSlide = (prev + 1) % sliderItems.length

                        // Make sure to scroll the slider when currentSlide changes
                        if (sliderRef.current) {
                            const scrollAmount = sliderRef.current.offsetWidth * nextSlide
                            sliderRef.current.scrollTo({
                                left: scrollAmount,
                                behavior: "smooth",
                            })
                        }

                        return nextSlide
                    })
                }
            }, 5000)
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [sliderItems.length, sliderPaused])

    return (
        <div className="enhanced-slider-container">
            <div
                className={`slider-track ${sliderPaused ? "paused" : ""}`}
                ref={sliderRef}
                onScroll={handleScroll}
                onMouseEnter={pauseSlider}
                onMouseLeave={resumeSlider}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {sliderItems.map((item, index) => (
                    <div
                        key={item.id}
                        className="enhanced-slider-item"
                        style={{
                            background: item.backgroundColor,
                        }}
                    >
                        <div className="slider-content-wrapper">
                            <div className="slider-text-section">
                                <div className="slider-icon-wrapper">
                                    <IonIcon icon={item.icon} className="slider-main-icon" />
                                </div>
                                <h2 className="enhanced-slider-title" style={{ color: item.textColor }}>
                                    {item.title}
                                </h2>
                                <p className="enhanced-slider-description" style={{ color: item.textColor }}>
                                    {item.description}
                                </p>
                                <button
                                    className="enhanced-slider-button"
                                    style={{
                                        background: `linear-gradient(135deg, ${item.buttonColor}, ${item.buttonColor}dd)`,
                                        boxShadow: `0 8px 32px ${item.buttonColor}40`,
                                    }}
                                    onClick={() => onSliderButtonClick(item.id)}
                                >
                                    <IonIcon icon={arrowForward} className="button-icon" />
                                    {item.buttonText}
                                </button>
                            </div>
                            <div className="slider-image-section">
                                <div className="image-container-products">
                                    <img src={item.imageUrl || "/placeholder.svg"} alt={item.title} className="slider-image" />
                                    <div className="image-overlay"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Enhanced indicators */}
            <div className="enhanced-slider-indicators">
                {sliderItems.map((_, index) => (
                    <button
                        key={index}
                        className={`enhanced-slider-indicator ${index === currentSlide ? "active" : ""}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Navigation arrows */}
            <button
                className="slider-nav-button slider-nav-prev"
                onClick={() => goToSlide((currentSlide - 1 + sliderItems.length) % sliderItems.length)}
                aria-label="Previous slide"
            >
                <IonIcon icon={arrowBack} />
            </button>

            <button
                className="slider-nav-button slider-nav-next"
                onClick={() => goToSlide((currentSlide + 1) % sliderItems.length)}
                aria-label="Next slide"
            >
                <IonIcon icon={arrowForward} />
            </button>
        </div>
    )
}

export default NormalSlider

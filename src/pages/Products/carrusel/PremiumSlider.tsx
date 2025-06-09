"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { IonIcon } from "@ionic/react"
import { arrowForward, arrowBack, diamond, sparkles, star, home } from "ionicons/icons"

interface PremiumSliderItem {
    id: number
    title: string
    description: string
    buttonText: string
    backgroundColor: string
    textColor: string
    buttonColor: string
    imageUrl: string
    icon: string
    action: () => void
}

interface PremiumSliderProps {
    darkMode: boolean
    onNavigateToNewProducts: () => void
    onNavigateToExclusiveOffers: () => void
    onNavigateToPremiumFeatures: () => void
    onNavigateToTrendingProducts: () => void
}

const PremiumSlider: React.FC<PremiumSliderProps> = ({
                                                         darkMode,
                                                         onNavigateToNewProducts,
                                                         onNavigateToExclusiveOffers,
                                                         onNavigateToPremiumFeatures,
                                                         onNavigateToTrendingProducts,
                                                     }) => {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [sliderPaused, setSliderPaused] = useState(false)
    const sliderRef = useRef<HTMLDivElement | null>(null)

    const premiumSliderItems: PremiumSliderItem[] = [
        {
            id: 1,
            title: "🆕 Productos Recién Llegados",
            description:
                "Descubre los productos más nuevos antes que nadie. Acceso exclusivo a los últimos artículos agregados por la comunidad.",
            buttonText: "Ver Novedades",
            backgroundColor: darkMode
                ? "linear-gradient(135deg, #2d1b69, #11998e)"
                : "linear-gradient(135deg, #667eea, #764ba2)",
            textColor: "#ffffff",
            buttonColor: "#4facfe",
            imageUrl: "nuevo.png",
            icon: sparkles,
            action: onNavigateToNewProducts,
        },
        {
            id: 2,
            title: "🔥 Artículos de Coleccionista",
            description: "Explora nuestra selección premium de artículos de colección. Encuentra piezas únicas y exclusivas.",
            buttonText: "Ver Coleccionables",
            backgroundColor: darkMode
                ? "linear-gradient(135deg, #8B0000, #FF4500)"
                : "linear-gradient(135deg, #f093fb, #f5576c)",
            textColor: "#ffffff",
            buttonColor: "#ff6b6b",
            imageUrl: "coleccionista.jpg",
            icon: diamond,
            action: onNavigateToExclusiveOffers,
        },
        {
            id: 3,
            title: "📈 Artículos de Decoración",
            description:
                "Transforma tu hogar con nuestra selección premium de artículos decorativos. Calidad y diseño exclusivo.",
            buttonText: "Ver Decoración",
            backgroundColor: darkMode
                ? "linear-gradient(135deg, #1a237e, #3949ab)"
                : "linear-gradient(135deg, #a8edea, #fed6e3)",
            textColor: "#ffffff",
            buttonColor: "#00d2ff",
            imageUrl: "decoracion.jpg",
            icon: home,
            action: onNavigateToTrendingProducts,
        },
        {
            id: 4,
            title: "👑 Artículos de Moda",
            description: "Descubre las últimas tendencias en moda premium. Ropa, accesorios y calzado exclusivos.",
            buttonText: "Explorar Moda",
            backgroundColor: darkMode
                ? "linear-gradient(135deg, #4a148c, #7b1fa2)"
                : "linear-gradient(135deg, #ffecd2, #fcb69f)",
            textColor: "#ffffff",
            buttonColor: "#ffd700",
            imageUrl: "moda.png",
            icon: star,
            action: onNavigateToPremiumFeatures,
        },
    ]

    const pauseSlider = () => setSliderPaused(true)
    const resumeSlider = () => setSliderPaused(false)

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

    const handleScroll = () => {
        if (sliderRef.current) {
            const scrollPosition = sliderRef.current.scrollLeft
            const slideWidth = sliderRef.current.offsetWidth
            const newSlide = Math.round(scrollPosition / slideWidth)

            if (newSlide !== currentSlide && newSlide >= 0 && newSlide < premiumSliderItems.length) {
                setCurrentSlide(newSlide)
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

    // Auto-scroll effect
    useEffect(() => {
        let timer: number | null = null

        if (!sliderPaused) {
            timer = window.setInterval(() => {
                if (premiumSliderItems.length > 0) {
                    setCurrentSlide((prev) => {
                        const nextSlide = (prev + 1) % premiumSliderItems.length

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
            }, 6000) // Slightly slower for premium content
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [premiumSliderItems.length, sliderPaused])

    return (
        <div className="premium-slider-container enhanced-slider-container">
            <div className="premium-badge">
                <IonIcon icon={diamond} />
                <span>Contenido Premium</span>
            </div>

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
                {premiumSliderItems.map((item, index) => (
                    <div
                        key={item.id}
                        className="enhanced-slider-item premium-slider-item"
                        style={{
                            background: item.backgroundColor,
                        }}
                    >
                        <div className="slider-content-wrapper">
                            <div className="slider-text-section">
                                <div className="slider-icon-wrapper">
                                    <IonIcon icon={item.icon} className="slider-main-icon premium-icon" />
                                </div>
                                <h2 className="enhanced-slider-title premium-title" style={{ color: item.textColor }}>
                                    {item.title}
                                </h2>
                                <p className="enhanced-slider-description premium-description" style={{ color: item.textColor }}>
                                    {item.description}
                                </p>
                                <button
                                    className="enhanced-slider-button premium-button"
                                    style={{
                                        background: `linear-gradient(135deg, ${item.buttonColor}, ${item.buttonColor}dd)`,
                                        boxShadow: `0 8px 32px ${item.buttonColor}40`,
                                    }}
                                    onClick={item.action}
                                >
                                    <IonIcon icon={arrowForward} className="button-icon" />
                                    {item.buttonText}
                                </button>
                            </div>
                            <div className="slider-image-section">
                                <div className="image-container-products premium-image-container">
                                    <img
                                        src={item.imageUrl || "/placeholder.svg"}
                                        alt={item.title}
                                        className="slider-image premium-image"
                                    />
                                    <div className="premium-overlay">
                                        <IonIcon icon={diamond} className="premium-overlay-icon" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Enhanced indicators with premium styling */}
            <div className="enhanced-slider-indicators premium-indicators">
                {premiumSliderItems.map((_, index) => (
                    <button
                        key={index}
                        className={`enhanced-slider-indicator premium-indicator ${index === currentSlide ? "active" : ""}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Navigation arrows with premium styling */}
            <button
                className="slider-nav-button slider-nav-prev premium-nav"
                onClick={() => goToSlide((currentSlide - 1 + premiumSliderItems.length) % premiumSliderItems.length)}
                aria-label="Previous slide"
            >
                <IonIcon icon={arrowBack} />
            </button>

            <button
                className="slider-nav-button slider-nav-next premium-nav"
                onClick={() => goToSlide((currentSlide + 1) % premiumSliderItems.length)}
                aria-label="Next slide"
            >
                <IonIcon icon={arrowForward} />
            </button>
        </div>
    )
}

export default PremiumSlider

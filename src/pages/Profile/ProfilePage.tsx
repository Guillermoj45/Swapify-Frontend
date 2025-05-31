"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useHistory } from "react-router-dom"

import {
    IonAvatar,
    IonBadge,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonLoading,
    IonMenuButton,
    IonPage,
    IonSegment,
    IonSegmentButton,
    IonThumbnail,
    IonToolbar,
} from "@ionic/react"

import {
    cartOutline,
    chatbubbleOutline,
    heartOutline,
    star,
    starOutline,
    cameraOutline,
    locationOutline,
    checkmarkCircleOutline,
} from "ionicons/icons"

import ProfileService, { type ProfileDTO, type ProductDTO } from "../../Services/ProfileService"
import "./ProfilePage.css"
import useAuthRedirect from "../../Services/useAuthRedirect"

export default function ProfilePage() {
    const history = useHistory()

    useAuthRedirect()

    const [loading, setLoading] = useState(true)
    const [loadingSaved, setLoadingSaved] = useState(false)
    const [profileData, setProfileData] = useState<ProfileDTO | null>(null)
    const [userProducts, setUserProducts] = useState<ProductDTO[]>([])
    const [savedProducts, setSavedProducts] = useState<ProductDTO[]>([])
    const [showAllProducts, setShowAllProducts] = useState(false)
    const [showAllSavedProducts, setShowAllSavedProducts] = useState(false)
    const [activeTab, setActiveTab] = useState("reseñas")
    const [bannerImage, setBannerImage] = useState<string>("")

    const [userInfo, setUserInfo] = useState({
        name: "",
        rating: 4,
        totalReviews: 349,
        itemsForSale: 0,
        trades: 249,
        fullName: "",
        city: "",
        hobby: "",
        socialMedia: "",
        biography: "",
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Effects

    useEffect(() => {
        // Listen for favorites updates from other pages
        const handleFavoritesUpdate = (event: CustomEvent) => {
            const { action, productId } = event.detail

            if (activeTab === "deseados") {
                // Refresh saved products immediately when favorites are updated
                const refreshSavedProducts = async () => {
                    try {
                        setLoadingSaved(true)
                        const saved = await ProfileService.getSavedProducts(true)
                        setSavedProducts(saved)
                    } catch (error) {
                        console.error("Error refreshing saved products:", error)
                    } finally {
                        setLoadingSaved(false)
                    }
                }

                refreshSavedProducts()
            }
        }

        // Add event listener for favorites updates
        window.addEventListener("favoritesUpdated", handleFavoritesUpdate as EventListener)

        return () => {
            window.removeEventListener("favoritesUpdated", handleFavoritesUpdate as EventListener)
        }
    }, [activeTab])

    // Enhanced useEffect for deseados tab with better performance
    useEffect(() => {
        if (activeTab === "deseados") {
            const loadSaved = async () => {
                // Only show loading if we don't have data yet
                if (savedProducts.length === 0) {
                    setLoadingSaved(true)
                }

                try {
                    // Always force refresh when switching to this tab for fresh data
                    const saved = await ProfileService.getSavedProducts(true)
                    setSavedProducts(saved)
                    setShowAllSavedProducts(false)
                } catch (error) {
                    console.error("Error loading saved products:", error)
                } finally {
                    setLoadingSaved(false)
                }
            }

            loadSaved()

            // Subscribe to cache changes for real-time updates
            const unsubscribe = ProfileService.subscribeSavedProducts((newData: ProductDTO[]) => {
                if (newData && Array.isArray(newData)) {
                    setSavedProducts(newData)
                }
            })

            return unsubscribe
        }
    }, [activeTab])

    useEffect(() => {
        const checkAuth = async () => {
            if (!sessionStorage.getItem("token")) {
                history.push("/login")
                return
            }

            const profileId = new URLSearchParams(location.search).get("profileId")
            setLoading(true)

            try {
                if (profileId) {
                    // Cargar perfil del vendedor
                    const profileInfo = await ProfileService.getProfileByIdAlternative(profileId)
                    setProfileData(profileInfo)
                    setBannerImage(profileInfo.banner)

                    setUserInfo((prev) => ({
                        ...prev,
                        name: profileInfo.nickname || "Vendedor",
                    }))
                } else {
                    // Cargar perfil del usuario autenticado
                    const profileInfo = await ProfileService.getProfileInfo()
                    setProfileData(profileInfo)
                    setBannerImage(profileInfo.banner)

                    const products = await ProfileService.getUserProducts()
                    setUserProducts(products)

                    setUserInfo((prev) => ({
                        ...prev,
                        name: profileInfo.nickname || "Usuario",
                        itemsForSale: products.length,
                    }))
                }
            } catch (error) {
                console.error("Error loading profile or products:", error)
            } finally {
                setLoading(false)
                setShowAllProducts(false)
            }
        }

        checkAuth()
    }, [location.search, history])

    useEffect(() => {
        if (activeTab === "deseados") {
            const loadSaved = async () => {
                // Only show loading if we don't have data yet
                if (savedProducts.length === 0) {
                    setLoadingSaved(true)
                }

                try {
                    // Use forceRefresh only if we suspect data might be stale
                    const shouldForceRefresh = savedProducts.length === 0
                    const saved = await ProfileService.getSavedProducts(shouldForceRefresh)

                    setSavedProducts(saved)
                    setShowAllSavedProducts(false)
                } catch (error) {
                    console.error("Error loading saved products:", error)
                } finally {
                    setLoadingSaved(false)
                }
            }

            loadSaved()
        }
    }, [activeTab])

    useEffect(() => {
        if (activeTab === "deseados") {
            // Set up a more intelligent refresh interval
            const refreshInterval = setInterval(async () => {
                try {
                    // Only refresh if the page is visible to avoid unnecessary API calls
                    if (!document.hidden) {
                        const saved = await ProfileService.getSavedProducts(true)
                        setSavedProducts(saved)
                    }
                } catch (error) {
                    console.error("Error refreshing saved products:", error)
                }
            }, 60000) // Increased to 60 seconds for better performance

            return () => clearInterval(refreshInterval)
        }
    }, [activeTab])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && activeTab === "deseados") {
                // Page became visible, refresh saved products
                ProfileService.getSavedProducts(true)
                    .then((saved) => {
                        setSavedProducts(saved)
                    })
                    .catch(console.error)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
    }, [activeTab])

    useEffect(() => {
        const isDark = sessionStorage.getItem("modoOscuroClaro") === "true"
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
        document.body.style.setProperty("--ion-background-color", isDark ? "#0a0a0a" : "#ffffff")
        document.body.style.setProperty("--ion-text-color", isDark ? "#ffffff" : "#333333")
    }, [])

    useEffect(() => {
        applyTheme()

        // Agregar un observador para cambios en sessionStorage
        const handleStorageChange = () => {
            applyTheme()
        }

        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
    }, [])

    const applyTheme = () => {
        const isDark = sessionStorage.getItem("modoOscuroClaro") === "true"
        if (isDark) {
            document.documentElement.setAttribute("data-theme", "dark")
            document.body.style.setProperty("--ion-background-color", "#0a0a0a")
            document.body.style.setProperty("--ion-text-color", "#ffffff")
        } else {
            document.documentElement.setAttribute("data-theme", "light")
            document.body.style.setProperty("--ion-background-color", "#ffffff")
            document.body.style.setProperty("--ion-text-color", "#333333")
        }
    }

    // Handlers
    const handleBannerClick = () => {
        const profileId = new URLSearchParams(location.search).get("profileId")
        if (!profileId) {
            fileInputRef.current?.click()
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            // Mostrar preview local
            const reader = new FileReader()
            reader.onloadend = () => setBannerImage(reader.result as string)
            reader.readAsDataURL(file)

            // Subir a servidor
            const result = await ProfileService.updateBanner(file)

            if (result.success) {
                setBannerImage(result.imageUrl)
            }
        } catch (error) {
            console.error("Error al subir la imagen:", error)
            // Aquí podrías mostrar un mensaje de error al usuario
        }
    }

    // Helpers
    const formatPoints = (points: number) => `${points} pts`
    const getProductImage = (images: string[]) => images[0] || "/placeholder.svg?height=60&width=60"
    const renderStars = (rating: number) =>
        Array.from({ length: 5 }, (_, i) => (
            <IonIcon key={i} icon={i < rating ? star : starOutline} className={i < rating ? "star-filled" : "star-outline"} />
        ))

    // Tab content renderer
    const renderTabContent = () => {
        if (activeTab === "enVenta") {
            const items = showAllProducts ? userProducts : userProducts.slice(0, 3)

            return (
                <div className="tab-content">
                    <div className="tab-header">
                        <h3 className="tab-title">
                            <IonIcon icon={cartOutline} className="tab-icon" />
                            Artículos en venta
                        </h3>
                        <IonBadge className="count-badge">{userInfo.itemsForSale}</IonBadge>
                    </div>
                    <IonList lines="none" className="modern-list">
                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Cargando productos...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="empty-state">
                                <IonIcon icon={cartOutline} className="empty-icon" />
                                <h4>No tienes productos en venta</h4>
                                <p>Comienza a vender tus artículos</p>
                            </div>
                        ) : (
                            items.map((product) => (
                                <IonItem key={product.id} className="modern-item-card">
                                    <IonThumbnail slot="start" className="modern-thumbnail">
                                        <img
                                            src={getProductImage(product.imagenes) || "/placeholder.svg"}
                                            alt={product.name}
                                            onError={(e) => {
                                                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=60&width=60"
                                            }}
                                        />
                                    </IonThumbnail>
                                    <div className="item-content">
                                        <h4 className="item-title">{product.name}</h4>
                                        <IonBadge className="modern-price-badge">{formatPoints(product.points)}</IonBadge>
                                        {product.categories?.length > 0 && (
                                            <div className="category-tags">
                                                {product.categories.slice(0, 2).map((cat, idx) => (
                                                    <span key={idx} className="category-tag">
                            {cat.name}
                          </span>
                                                ))}
                                                {product.categories.length > 2 && (
                                                    <span className="more-tags">+{product.categories.length - 2}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </IonItem>
                            ))
                        )}
                    </IonList>
                    {userProducts.length > 3 && (
                        <IonButton
                            expand="block"
                            className="modern-view-all-btn"
                            onClick={() => setShowAllProducts(!showAllProducts)}
                        >
                            {showAllProducts ? "Mostrar menos" : `Ver todos (${userProducts.length})`}
                        </IonButton>
                    )}
                </div>
            )
        }

        if (activeTab === "deseados") {
            const items = showAllSavedProducts ? savedProducts : savedProducts.slice(0, 3)

            return (
                <div className="tab-content">
                    <div className="tab-header">
                        <h3 className="tab-title">
                            <IonIcon icon={heartOutline} className="tab-icon" />
                            Lista de deseos
                        </h3>
                        <IonBadge className="count-badge">{savedProducts.length}</IonBadge>
                    </div>
                    <IonList lines="none" className="modern-list">
                        {loadingSaved ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Cargando productos guardados...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="empty-state">
                                <IonIcon icon={heartOutline} className="empty-icon" />
                                <h4>No tienes productos guardados</h4>
                                <p>Guarda productos que te interesen</p>
                            </div>
                        ) : (
                            items.map((product) => (
                                <IonItem key={product.id} className="modern-item-card wishlist-item">
                                    <IonThumbnail slot="start" className="modern-thumbnail">
                                        <img
                                            src={getProductImage(product.imagenes) || "/placeholder.svg"}
                                            alt={product.name}
                                            onError={(e) => {
                                                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=60&width=60"
                                            }}
                                        />
                                    </IonThumbnail>
                                    <div className="item-content">
                                        <h4 className="item-title">{product.name}</h4>
                                        <IonBadge className="modern-price-badge secondary">{formatPoints(product.points)}</IonBadge>
                                        <div className="seller-info">
                                            <small>Vendedor: {product.profile.nickname}</small>
                                        </div>
                                        {product.categories?.length > 0 && (
                                            <div className="category-tags">
                                                {product.categories.slice(0, 2).map((cat, idx) => (
                                                    <span key={idx} className="category-tag">
                            {cat.name}
                          </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </IonItem>
                            ))
                        )}
                    </IonList>
                    {savedProducts.length > 3 && (
                        <IonButton
                            expand="block"
                            className="modern-view-all-btn"
                            onClick={() => setShowAllSavedProducts(!showAllSavedProducts)}
                        >
                            {showAllSavedProducts ? "Mostrar menos" : `Ver todos (${savedProducts.length})`}
                        </IonButton>
                    )}
                </div>
            )
        }

        // Reseñas por defecto
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h3 className="tab-title">
                        <IonIcon icon={chatbubbleOutline} className="tab-icon" />
                        Reseñas
                    </h3>
                    <IonBadge className="count-badge">{userInfo.totalReviews}</IonBadge>
                </div>
                <div className="reviews-container">
                    <div className="review-card">
                        <div className="review-header">
                            <div className="reviewer-avatar">
                                <img src="/placeholder.svg?height=40&width=40" alt="Reviewer" />
                            </div>
                            <div className="reviewer-info">
                                <h5>María García</h5>
                                <div className="review-rating">{renderStars(5)}</div>
                            </div>
                            <span className="review-date">Hace 2 días</span>
                        </div>
                        <p className="review-text">
                            Excelente vendedor, muy confiable y rápido en la entrega. El producto llegó en perfectas condiciones.
                        </p>
                    </div>

                    <div className="review-card">
                        <div className="review-header">
                            <div className="reviewer-avatar">
                                <img src="/placeholder.svg?height=40&width=40" alt="Reviewer" />
                            </div>
                            <div className="reviewer-info">
                                <h5>Carlos Ruiz</h5>
                                <div className="review-rating">{renderStars(4)}</div>
                            </div>
                            <span className="review-date">Hace 1 semana</span>
                        </div>
                        <p className="review-text">
                            Muy buena experiencia de compra. Comunicación fluida y producto tal como se describía.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const isPremium = profileData?.premium !== "FREE"

    // Render
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="modern-toolbar">
                    <IonMenuButton slot="start" />
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className={sessionStorage.getItem("modoOscuroClaro") === "true" ? "dark-mode" : ""}>
                <IonLoading isOpen={loading} message="Cargando perfil..." />

                <div
                    className="modern-hero-banner"
                    onClick={handleBannerClick}
                    style={{ backgroundImage: bannerImage ? `url(${bannerImage})` : "none" }}
                >
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
                    {!bannerImage && (
                        <div className="banner-placeholder">
                            <IonIcon icon={cameraOutline} className="camera-icon" />
                            <span>Añadir imagen de fondo</span>
                        </div>
                    )}
                    <div className="banner-overlay"></div>
                </div>

                <section className="modern-profile-header">
                    <div className="profile-container">
                        <div className="profile-main">
                            <div className="profile-avatar-container">
                                <IonAvatar className="modern-avatar">
                                    <img src={profileData?.avatar || "/placeholder.svg?height=80&width=80"} alt="User avatar" />
                                </IonAvatar>
                                {profileData?.newUser && (
                                    <div className="new-user-indicator">
                                        <IonIcon icon={checkmarkCircleOutline} />
                                    </div>
                                )}
                            </div>

                            <div className="profile-info-container">
                                <div className="profile-badges">
                                    {isPremium && (
                                        <IonBadge className="premium-badge">
                                            <IonIcon icon={star} />
                                            PREMIUM
                                        </IonBadge>
                                    )}
                                    {profileData?.newUser && <IonBadge className="new-user-badge">Nuevo usuario</IonBadge>}
                                </div>

                                <h2 className="modern-profile-name">{userInfo.name}</h2>

                                {profileData?.ubicacion && (
                                    <div className="location-container">
                                        <IonIcon icon={locationOutline} className="location-icon" />
                                        <span className="location-text">{profileData.ubicacion}</span>
                                    </div>
                                )}

                                <div className="rating-container">
                                    <div className="stars-wrapper">{renderStars(userInfo.rating)}</div>
                                    <span className="rating-text">({userInfo.totalReviews} reseñas)</span>
                                </div>

                                <div className="stats-container">
                                    <div className="stat-item">
                                        <IonIcon icon={checkmarkCircleOutline} className="stat-icon" />
                                        <span>100% fiable</span>
                                    </div>
                                    <div className="stat-item">
                                        <IonIcon icon={cartOutline} className="stat-icon" />
                                        <span>31 comprados</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="modern-profile-tabs">
                    <div className="tabs-container">
                        <IonSegment
                            value={activeTab}
                            onIonChange={(e) => setActiveTab(String(e.detail.value))}
                            className="modern-segment"
                        >
                            <IonSegmentButton value="enVenta" className="modern-segment-button">
                                <div className="segment-content">
                                    <IonIcon icon={cartOutline} />
                                    <IonLabel>En venta</IonLabel>
                                </div>
                            </IonSegmentButton>
                            <IonSegmentButton value="deseados" className="modern-segment-button">
                                <div className="segment-content">
                                    <IonIcon icon={heartOutline} />
                                    <IonLabel>Deseados</IonLabel>
                                </div>
                            </IonSegmentButton>
                            <IonSegmentButton value="reseñas" className="modern-segment-button">
                                <div className="segment-content">
                                    <IonIcon icon={chatbubbleOutline} />
                                    <IonLabel>Reseñas</IonLabel>
                                </div>
                            </IonSegmentButton>
                        </IonSegment>

                        <div className="tab-content-container">{renderTabContent()}</div>
                    </div>
                </section>
            </IonContent>
        </IonPage>
    )
}

"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
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
    IonAlert,
    IonToast,
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
    trashOutline,
} from "ionicons/icons"

import ProfileService, { type ProfileDTO, type ProductDTO } from "../../Services/ProfileService"
import { type Product, ProductService } from "../../Services/ProductService"
import "./ProfilePage.css"
import useAuthRedirect from "../../Services/useAuthRedirect"
import ReviewsService, { type ReviewDTO } from "../../Services/ReviewsService"
import ReviewModal from "./modal/ReviewModal"

export default function ProfilePage() {
    const history = useHistory()
    useAuthRedirect()

    const [loading, setLoading] = useState(true)
    const [loadingSaved, setLoadingSaved] = useState(false)
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
    const [profileData, setProfileData] = useState<ProfileDTO | null>(null)
    const [userProducts, setUserProducts] = useState<Product[]>([])
    const [savedProducts, setSavedProducts] = useState<ProductDTO[]>([])
    const [showAllProducts, setShowAllProducts] = useState(false)
    const [showAllSavedProducts, setShowAllSavedProducts] = useState(false)
    const [activeTab, setActiveTab] = useState("reseñas")
    const [bannerImage, setBannerImage] = useState<string>("")

    // Alert and Toast states
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)
    const [productToDelete, setProductToDelete] = useState<string | null>(null)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState("")
    const [toastColor, setToastColor] = useState<"success" | "danger">("success")

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

    const [reviews, setReviews] = useState<ReviewDTO[]>([])
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
    const [showDeleteReviewAlert, setShowDeleteReviewAlert] = useState(false)
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null)

    // Memoized delete function to prevent multiple calls
    const borrarProducto = useCallback(
        async (productId: string) => {
            if (deletingProductId) {
                console.log("Delete already in progress, ignoring...")
                return
            }

            try {
                setDeletingProductId(productId)
                console.log("Starting delete for product:", productId)

                const result = await ProductService.borrarProducto(productId)

                if (result.success) {
                    // Immediately update local state
                    setUserProducts((prevProducts) => {
                        const updatedProducts = prevProducts.filter((product) => product.id !== productId)
                        console.log("Updated products after deletion:", updatedProducts.length)
                        return updatedProducts
                    })

                    // Update item count
                    setUserInfo((prev) => ({
                        ...prev,
                        itemsForSale: prev.itemsForSale - 1,
                    }))

                    // Show success message
                    setToastMessage(result.message)
                    setToastColor("success")
                    setShowToast(true)

                    console.log("Product deleted successfully from UI")
                } else {
                    throw new Error(result.message)
                }
            } catch (error) {
                console.error("Error al borrar el producto:", error)
                setToastMessage(error instanceof Error ? error.message : "Error al eliminar el producto")
                setToastColor("danger")
                setShowToast(true)
            } finally {
                setDeletingProductId(null)
                setShowDeleteAlert(false)
                setProductToDelete(null)
            }
        },
        [deletingProductId],
    )

    // Handle delete confirmation
    const handleDeleteClick = (productId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        setProductToDelete(productId)
        setShowDeleteAlert(true)
    }

    const confirmDelete = () => {
        if (productToDelete) {
            borrarProducto(productToDelete)
        }
    }

    // Load user products with better error handling
    const loadUserProducts = useCallback(async (forceRefresh = false) => {
        try {
            console.log("Loading user products, forceRefresh:", forceRefresh)
            const products = await ProductService.getUserProducts(true, forceRefresh)
            setUserProducts(products)
            setUserInfo((prev) => ({
                ...prev,
                itemsForSale: products.length,
            }))
            console.log("Loaded products:", products.length)
        } catch (error) {
            console.error("Error loading user products:", error)
        }
    }, [])

    // Load reviews for the current profile
    const loadReviews = useCallback(async (profileId: string) => {
        try {
            setLoadingReviews(true)
            const reviewsData = await ReviewsService.getReviewsByProfileId(profileId)
            setReviews(reviewsData)
            setUserInfo((prev) => ({
                ...prev,
                totalReviews: reviewsData.length,
            }))
        } catch (error) {
            console.error("Error loading reviews:", error)
            setReviews([])
        } finally {
            setLoadingReviews(false)
        }
    }, [])

    // Handle review deletion
    const handleDeleteReview = (reviewId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        setReviewToDelete(reviewId)
        setShowDeleteReviewAlert(true)
    }

    const confirmDeleteReview = async () => {
        if (!reviewToDelete) return

        try {
            setDeletingReviewId(reviewToDelete)
            await ReviewsService.deleteReview(reviewToDelete)

            // Update local state
            setReviews((prev) => prev.filter((review) => review.id !== reviewToDelete))
            setUserInfo((prev) => ({
                ...prev,
                totalReviews: prev.totalReviews - 1,
            }))

            setToastMessage("Reseña eliminada correctamente")
            setToastColor("success")
            setShowToast(true)
        } catch (error: any) {
            setToastMessage(error.message || "Error al eliminar la reseña")
            setToastColor("danger")
            setShowToast(true)
        } finally {
            setDeletingReviewId(null)
            setShowDeleteReviewAlert(false)
            setReviewToDelete(null)
        }
    }

    const handleReviewCreated = () => {
        // Reload reviews after creating a new one
        const profileId = new URLSearchParams(location.search).get("profileId") || profileData?.id
        if (profileId) {
            loadReviews(profileId)
        }
    }

    // Effects
    useEffect(() => {
        const handleFavoritesUpdate = (event: CustomEvent) => {
            const { action, productId } = event.detail
            const profileId = new URLSearchParams(location.search).get("profileId")

            // Solo actualizamos productos deseados si estamos en la tab deseados y NO hay profileId
            if (activeTab === "deseados" && !profileId) {
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
            } else {
                // Si hay profileId, limpiamos la lista de deseados
                setSavedProducts([])
            }
        }

        window.addEventListener("favoritesUpdated", handleFavoritesUpdate as EventListener)
        return () => {
            window.removeEventListener("favoritesUpdated", handleFavoritesUpdate as EventListener)
        }
    }, [activeTab, location.search]) // Añadido location.search como dependencia

    useEffect(() => {
        if (activeTab === "deseados") {
            const loadSaved = async () => {
                if (savedProducts.length === 0) {
                    setLoadingSaved(true)
                }

                try {
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
                    const profileInfo = await ProfileService.getProfileByIdAlternative(profileId)
                    setProfileData(profileInfo)
                    setBannerImage(profileInfo.banner)

                    // Load reviews for the profile
                    await loadReviews(profileId)

                    // Add this code to load the other user's products
                    try {
                        const otherUserProducts = await ProductService.getProductsByProfileId(profileId)
                        setUserProducts(otherUserProducts)
                        setUserInfo((prev) => ({
                            ...prev,
                            name: profileInfo.nickname || "Vendedor",
                            itemsForSale: otherUserProducts.length,
                        }))
                    } catch (error) {
                        console.error("Error loading other user's products:", error)
                    }
                } else {
                    const profileInfo = await ProfileService.getProfileInfo()
                    setProfileData(profileInfo)
                    setBannerImage(profileInfo.banner)

                    // Load reviews for own profile
                    await loadReviews(profileInfo.id)

                    // Load user products
                    await loadUserProducts(true)

                    setUserInfo((prev) => ({
                        ...prev,
                        name: profileInfo.nickname || "Usuario",
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
    }, [location.search, history, loadUserProducts, loadReviews])

    useEffect(() => {
        const isDark = sessionStorage.getItem("modoOscuroClaro") === "true"
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
        document.body.style.setProperty("--ion-background-color", isDark ? "#0a0a0a" : "#ffffff")
        document.body.style.setProperty("--ion-text-color", isDark ? "#ffffff" : "#333333")
    }, [])

    useEffect(() => {
        applyTheme()
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
            const reader = new FileReader()
            reader.onloadend = () => setBannerImage(reader.result as string)
            reader.readAsDataURL(file)

            const result = await ProfileService.updateBanner(file)

            if (result.success) {
                setBannerImage(result.imageUrl)
            }
        } catch (error) {
            console.error("Error al subir la imagen:", error)
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
                                <h4>
                                    {!new URLSearchParams(location.search).get("profileId")
                                        ? "No tienes productos guardados"
                                        : "En este apartado dentro te tu perfil podrás ver los productos que has guardado de otros usuarios"}
                                </h4>
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
                                            </div>
                                        )}
                                    </div>
                                    {!new URLSearchParams(location.search).get("profileId") && (
                                        <IonIcon
                                            icon={trashOutline}
                                            slot="end"
                                            className={`delete-icon ${deletingProductId === product.id ? "deleting" : ""}`}
                                            onClick={(e) => handleDeleteClick(product.id, e)}
                                            style={{
                                                opacity: deletingProductId === product.id ? 0.5 : 1,
                                                pointerEvents: deletingProductId ? "none" : "auto",
                                            }}
                                        />
                                    )}
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
                        ) : new URLSearchParams(location.search).get("profileId") ? (
                            <div className="empty-state">
                                <IonIcon icon={heartOutline} className="empty-icon" />
                                <h4>Los productos deseados son privados</h4>
                                <p>Solo puedes ver tus propios productos deseados</p>
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
                    {!new URLSearchParams(location.search).get("profileId") && savedProducts.length > 3 && (
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
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <IonBadge className="count-badge">{userInfo.totalReviews}</IonBadge>
                        {/* Show write review button only when viewing another user's profile */}
                        {new URLSearchParams(location.search).get("profileId") && (
                            <IonButton size="small" className="modern-write-review-btn" onClick={() => setShowReviewModal(true)}>
                                <IonIcon icon={chatbubbleOutline} slot="start" />
                                Escribir reseña
                            </IonButton>
                        )}
                    </div>
                </div>

                <div className="reviews-container">
                    {loadingReviews ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Cargando reseñas...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="empty-state">
                            <IonIcon icon={chatbubbleOutline} className="empty-icon" />
                            <h4>No hay reseñas aún</h4>
                            <p>
                                {new URLSearchParams(location.search).get("profileId")
                                    ? "Sé el primero en escribir una reseña"
                                    : "Aún no has recibido reseñas"}
                            </p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className={`review-card ${deletingReviewId === review.id ? "deleting" : ""}`}>
                                <div className="review-header">
                                    <div className="reviewer-avatar">
                                        <img src={ReviewsService.processAvatar(review.writerAvatar || "")} alt="Reviewer" />
                                    </div>
                                    <div className="reviewer-info">
                                        <h5>{review.writerNickname || "Usuario"}</h5>
                                        <div className="review-rating">{renderStars(review.stars)}</div>
                                    </div>
                                    <div className="review-actions">
                    <span className="review-date">
                      {review.datetime ? ReviewsService.formatDate(review.datetime) : "Fecha desconocida"}
                    </span>
                                        {/* Show delete button if user is the author or profile owner */}
                                        {review.idProfileWriter === profileData?.id && (
                                            <div className="delete-tooltip">
                                                <IonButton
                                                    fill="clear"
                                                    className={`modern-delete-review-btn ${deletingReviewId === review.id ? "deleting" : ""}`}
                                                    onClick={(e) => handleDeleteReview(review.id!, e)}
                                                    disabled={deletingReviewId === review.id}
                                                >
                                                    <IonIcon icon={trashOutline} />
                                                </IonButton>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="review-text">{review.description}</p>
                            </div>
                        ))
                    )}
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
                <IonLoading
                    isOpen={loading}
                    message="Cargando perfil..."
                    spinner="crescent"
                    cssClass="custom-loading-spinner"
                />

                {/* Delete Confirmation Alert */}
                <IonAlert
                    isOpen={showDeleteAlert}
                    onDidDismiss={() => {
                        setShowDeleteAlert(false)
                        setProductToDelete(null)
                    }}
                    header="Confirmar eliminación"
                    message="¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer."
                    buttons={[
                        {
                            text: "Cancelar",
                            role: "cancel",
                            cssClass: "secondary",
                        },
                        {
                            text: "Eliminar",
                            cssClass: "danger",
                            handler: confirmDelete,
                        },
                    ]}
                />

                {/* Toast for feedback */}
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={3000}
                    color={toastColor}
                    position="top"
                />

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
                            style={{ right: "16px" }}
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
                <br />
                <br />
                {/* Review Modal */}
                {profileData && (
                    <ReviewModal
                        isOpen={showReviewModal}
                        onClose={() => setShowReviewModal(false)}
                        profileId={new URLSearchParams(location.search).get("profileId") || ""}
                        profileName={profileData.nickname || "Usuario"}
                        onReviewCreated={handleReviewCreated}
                    />
                )}

                {/* Delete Review Confirmation Alert */}
                <IonAlert
                    isOpen={showDeleteReviewAlert}
                    onDidDismiss={() => {
                        setShowDeleteReviewAlert(false)
                        setReviewToDelete(null)
                    }}
                    header="Confirmar eliminación"
                    message="¿Estás seguro de que quieres eliminar esta reseña? Esta acción no se puede deshacer."
                    buttons={[
                        {
                            text: "Cancelar",
                            role: "cancel",
                            cssClass: "secondary",
                        },
                        {
                            text: "Eliminar",
                            cssClass: "danger",
                            handler: confirmDeleteReview,
                        },
                    ]}
                />
            </IonContent>
        </IonPage>
    )
}

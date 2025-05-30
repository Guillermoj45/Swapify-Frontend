"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    IonToast,
    IonChip,
    IonLabel,
    IonBadge,
    IonAvatar,
} from "@ionic/react"
import { useParams, useHistory } from "react-router-dom"
import {
    shareOutline,
    chatbubbleOutline,
    timeOutline,
    locationOutline,
    personOutline,
    arrowBack,
    arrowForward,
    star,
} from "ionicons/icons"
import { ProductService, type Product } from "../../Services/ProductService"
import cloudinaryImage from "../../Services/CloudinaryService"
import "./ProductDetailPage.css"
import useAuthRedirect from "../../Services/useAuthRedirect"

interface ProductDetailPageParams {
    id: string
    profileId: string
}

const ProductDetailPage: React.FC = () => {
    useAuthRedirect()

    const { id, profileId } = useParams<ProductDetailPageParams>()
    const history = useHistory()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [showToast, setShowToast] = useState<boolean>(false)
    const [toastMessage, setToastMessage] = useState<string>("")
    const [toastColor, setToastColor] = useState<string>("danger")
    const [darkMode, setDarkMode] = useState<boolean>(false)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [relatedProductsLoading, setRelatedProductsLoading] = useState<boolean>(false)
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
    const [sharingInProgress, setSharingInProgress] = useState<boolean>(false)

    // Check user's preferred color scheme on component mount
    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setDarkMode(prefersDark)

        // Apply theme class to body
        document.body.classList.toggle("dark-theme", prefersDark)
    }, [])

    // Apply dark mode class when darkMode state changes
    useEffect(() => {
        document.body.classList.toggle("dark-theme", darkMode)
    }, [darkMode])

    // Fetch product data
    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                setLoading(true)

                const effectiveProfileId =
                    profileId || sessionStorage.getItem("profileId") || "f708820d-a3eb-43ba-b9d0-e9bc749ae686"
                const sessionToken = sessionStorage.getItem("token")

                if (!sessionToken) {
                    throw new Error("No hay token de autenticación disponible")
                }

                const productData = await ProductService.getProductById(id, effectiveProfileId)
                setProduct(productData)
                setLoading(false)
            } catch (err) {
                console.error("Error al cargar los detalles del producto:", err)
                setError("No se pudieron cargar los detalles del producto")
                setLoading(false)
                setShowToast(true)
            }
        }

        fetchProductDetail()
    }, [id, profileId])

    // Fetch related products when product is loaded
    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!product || !product.categories || product.categories.length === 0) {
                return
            }

            try {
                setRelatedProductsLoading(true)

                // Extraer los nombres de las categorías
                const categoryNames = product.categories.map((cat) => cat.name)

                // Obtener productos relacionados
                const related = await ProductService.getRelatedProductsByCategories(categoryNames, product.id, 4)

                setRelatedProducts(related)
            } catch (err) {
                console.error("Error al cargar productos relacionados:", err)
                // No mostramos error al usuario para productos relacionados, solo log
                setRelatedProducts([])
            } finally {
                setRelatedProductsLoading(false)
            }
        }

        fetchRelatedProducts()
    }, [product])

    // Effect para controlar los indicadores de scroll de categorías
    useEffect(() => {
        if (product) {
            const categoriesContainer = document.querySelector(".product-detail-categories") as HTMLElement
            if (categoriesContainer) {
                const handleScroll = () => {
                    if (categoriesContainer.scrollLeft > 0) {
                        categoriesContainer.classList.add("scrolled-start")
                    } else {
                        categoriesContainer.classList.remove("scrolled-start")
                    }

                    if (
                        Math.ceil(categoriesContainer.scrollLeft + categoriesContainer.clientWidth) >=
                        categoriesContainer.scrollWidth
                    ) {
                        categoriesContainer.classList.add("scrolled-end")
                    } else {
                        categoriesContainer.classList.remove("scrolled-end")
                    }
                }

                // Ejecutar una vez para configurar el estado inicial
                handleScroll()

                // Agregar event listener
                categoriesContainer.addEventListener("scroll", handleScroll)

                // Limpieza
                return () => {
                    categoriesContainer.removeEventListener("scroll", handleScroll)
                }
            }
        }
    }, [product])

    const shareProduct = async () => {
        if (sharingInProgress) return // Evitar solicitudes múltiples

        try {
            setSharingInProgress(true)

            if (!product || !id) {
                throw new Error("No hay información suficiente para compartir el producto")
            }

            const effectiveProfileId = profileId || product.profile.id
            if (!effectiveProfileId) {
                throw new Error("No se puede determinar el ID del perfil")
            }

            // 1. Construir la URL pública (sin token)
            const productUrl = `${window.location.origin}/product/${id}/${effectiveProfileId}`

            // 2. Copiar al portapapeles
            await navigator.clipboard.writeText(productUrl)

            // 3. Mostrar mensaje de éxito
            setToastMessage("¡Enlace copiado al portapapeles!")
            setToastColor("success")
            setShowToast(true)
        } catch (err: any) {
            console.error("Error al compartir el producto:", err)
            setToastMessage(`Error al compartir: ${err.message || "Error desconocido"}`)
            setToastColor("danger")
            setShowToast(true)
        } finally {
            setSharingInProgress(false)
        }
    }

    // Format date to a readable string
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    // Función para formatear los puntos como "X anuncios"
    const formatPoints = (points: number): string => {
        if (points < 0) return "Sin valoración"
        return `${points} puntos`
    }

    // Calculate time since creation
    const getTimeSince = (dateString: string): string => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return "Hoy"
        if (diffDays === 1) return "Ayer"
        if (diffDays < 7) return `Hace ${diffDays} días`
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7)
            return `Hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`
        }
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30)
            return `Hace ${months} ${months === 1 ? "mes" : "meses"}`
        }
        const years = Math.floor(diffDays / 365)
        return `Hace ${years} ${years === 1 ? "año" : "años"}`
    }

    // Function to get the image URL using Cloudinary service
    const getImageUrl = (imagePath: string | null): string | null => {
        if (!imagePath) return null

        try {
            return cloudinaryImage(imagePath)
        } catch (error) {
            console.error("Error generating image URL:", error)
            return null
        }
    }

    // Handle image navigation
    const nextImage = () => {
        if (product && product.imagenes && product.imagenes.length > 0) {
            setCurrentImageIndex((currentImageIndex + 1) % product.imagenes.length)
        }
    }

    const prevImage = () => {
        if (product && product.imagenes && product.imagenes.length > 0) {
            setCurrentImageIndex((currentImageIndex - 1 + product.imagenes.length) % product.imagenes.length)
        }
    }

    // Manejar acción de contacto con el vendedor, incluyendo el token si existe
    const handleContactSeller = () => {
        const chatUrl = `/Chat?profileId=${product?.profile.id}&productId=${id}&question=true`
        window.location.href = chatUrl
    }

    // Manejar acción de ver perfil del vendedor, incluyendo el token si existe
    const handleViewProfile = () => {
        const profileUrl = `/profile?profileId=${product?.profile.id}`
        window.location.href = profileUrl
    }

    // Handle related product click
    const handleRelatedProductClick = (relatedProduct: Product) => {
        const relatedUrl = `/product/${relatedProduct.id}/${relatedProduct.profile.id}`
        history.push(relatedUrl)
    }

    return (
        <IonPage className={`product-detail-page ${darkMode ? "dark-theme" : "light-theme"}`}>
            <IonHeader>
                <IonToolbar className={`modern-toolbar ${darkMode ? "dark-toolbar" : ""}`}>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/products" />
                    </IonButtons>
                    <IonTitle>Detalles del producto</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={shareProduct} disabled={sharingInProgress} className="share-button">
                            <IonIcon icon={shareOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="modern-content">
                {/* Toast para errores y notificaciones */}
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={error || toastMessage || "Ocurrió un error"}
                    duration={3000}
                    position="bottom"
                    color={toastColor}
                    className="modern-toast"
                />

                {loading ? (
                    <div className="modern-loading-container">
                        <div className="loading-spinner">
                            <IonSpinner name="circular" />
                        </div>
                        <h3>Cargando detalles del producto...</h3>
                        <p>Por favor espera un momento</p>
                    </div>
                ) : error ? (
                    <div className="modern-error-container">
                        <div className="error-icon">⚠️</div>
                        <h3>Error al cargar</h3>
                        <p>No se pudieron cargar los detalles del producto. Inténtalo de nuevo más tarde.</p>
                        <IonButton onClick={() => window.location.reload()} className="retry-button">
                            Reintentar
                        </IonButton>
                    </div>
                ) : product ? (
                    <div className="modern-product-container">
                        {/* Imagen del producto */}
                        <div className="modern-image-container">
                            {product.imagenes && product.imagenes.length > 0 ? (
                                <>
                                    <div className="image-wrapper">
                                        <img
                                            src={getImageUrl(product.imagenes[currentImageIndex]) || ""}
                                            alt={product.name}
                                            className="modern-product-image"
                                            onError={(e) => {
                                                // Fallback si la imagen no carga
                                                const target = e.target as HTMLImageElement
                                                target.src =
                                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23cccccc"/%3E%3Ctext x="50" y="50" fontFamily="Arial" fontSize="20" textAnchor="middle" dominantBaseline="middle" fill="%23ffffff"%3E' +
                                                    product.name.charAt(0) +
                                                    "%3C/text%3E%3C/svg%3E"
                                            }}
                                        />
                                    </div>
                                    {product.imagenes.length > 1 && (
                                        <>
                                            <button className="modern-nav-button nav-prev" onClick={prevImage} aria-label="Previous image">
                                                <IonIcon icon={arrowBack} />
                                            </button>
                                            <button className="modern-nav-button nav-next" onClick={nextImage} aria-label="Next image">
                                                <IonIcon icon={arrowForward} />
                                            </button>
                                            <div className="modern-image-indicators">
                                                {product.imagenes.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        className={`modern-indicator ${idx === currentImageIndex ? "active" : ""}`}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="modern-placeholder-image">
                                    <div className="placeholder-content">
                                        <span className="placeholder-letter">{product.name.charAt(0)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detalles del producto */}
                        <div className="modern-product-info">
                            <div className="product-header">
                                <h1 className="modern-product-title">{product.name}</h1>
                                <div className="product-meta">
                                    <div className="rating-container">
                                        <IonIcon icon={star} className="star-icon" />
                                        <span>{formatPoints(product.points)}</span>
                                    </div>
                                    <div className="time-container">
                                        <IonIcon icon={timeOutline} />
                                        <span>{getTimeSince(product.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modern-categories-wrapper">
                                <div className="modern-categories" id="categories-slider">
                                    {product.categories && product.categories.length > 0 ? (
                                        product.categories.map((category, idx) => (
                                            <IonChip key={idx} className="modern-category-chip">
                                                <IonLabel>{category.name}</IonLabel>
                                            </IonChip>
                                        ))
                                    ) : (
                                        <IonChip className="modern-category-chip default">
                                            <IonLabel>Sin categoría</IonLabel>
                                        </IonChip>
                                    )}
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="modern-description">
                                <h2>Descripción</h2>
                                <p>{product.description}</p>
                            </div>

                            {/* Fechas de creación y actualización */}
                            <div className="modern-dates">
                                <div className="date-item">
                                    <span className="date-label">Publicado:</span>
                                    <span className="date-value">{formatDate(product.createdAt)}</span>
                                </div>
                            </div>

                            {/* Información de usuario */}
                            <div className="modern-user-info" onClick={handleViewProfile}>
                                {product.profile && (
                                    <>
                                        <div className="modern-avatar">
                                            {product.profile.avatar ? (
                                                <IonAvatar>
                                                    <img
                                                        src={getImageUrl(product.profile.avatar) || ""}
                                                        alt={product.profile.nickname}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.src =
                                                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23cccccc"/%3E%3Ctext x="50" y="50" fontFamily="Arial" fontSize="20" textAnchor="middle" dominantBaseline="middle" fill="%23ffffff"%3E' +
                                                                product.profile.nickname.charAt(0) +
                                                                "%3C/text%3E%3C/svg%3E"
                                                        }}
                                                    />
                                                </IonAvatar>
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    <IonIcon icon={personOutline} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="user-details">
                                            <h3>Vendedor</h3>
                                            <p>{product.profile.nickname}</p>
                                            <div className="user-badges">
                                                {product.profile.premium !== "FREE" && (
                                                    <IonBadge className="premium-badge">{product.profile.premium}</IonBadge>
                                                )}
                                                {product.profile.newUser && <IonBadge className="new-user-badge">Nuevo</IonBadge>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Ubicación */}
                            <div className="modern-location">
                                <IonIcon icon={locationOutline} />
                                <span>{product.profile.ubicacion || "Ubicación no especificada"}</span>
                            </div>

                            {/* Botones de acción */}
                            <div className="modern-actions">
                                <IonButton expand="block" className="modern-primary-button" onClick={handleContactSeller}>
                                    <IonIcon slot="start" icon={chatbubbleOutline} />
                                    Hacer una pregunta
                                </IonButton>
                            </div>
                        </div>

                        {/* Productos relacionados */}
                        {(relatedProducts.length > 0 || relatedProductsLoading) && (
                            <div className="modern-related-products">
                                <h2>Productos relacionados</h2>
                                {relatedProductsLoading ? (
                                    <div className="modern-loading-container small">
                                        <IonSpinner name="circular" />
                                        <p>Cargando productos relacionados...</p>
                                    </div>
                                ) : (
                                    <div className="related-products-grid">
                                        {relatedProducts.map((relProduct) => (
                                            <div
                                                key={relProduct.id}
                                                className="modern-product-card"
                                                onClick={() => handleRelatedProductClick(relProduct)}
                                            >
                                                <div className="card-image">
                                                    {relProduct.imagenes && relProduct.imagenes.length > 0 ? (
                                                        <img
                                                            src={relProduct.imagenes[0] || ""}
                                                            alt={relProduct.name}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src =
                                                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23cccccc"/%3E%3Ctext x="50" y="50" fontFamily="Arial" fontSize="20" textAnchor="middle" dominantBaseline="middle" fill="%23ffffff"%3E' +
                                                                    relProduct.name.charAt(0) +
                                                                    "%3C/text%3E%3C/svg%3E"
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="card-placeholder">
                                                            <span>{relProduct.name.charAt(0)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="card-content">
                                                    <h3>{relProduct.name}</h3>
                                                    <p className="card-points">{formatPoints(relProduct.points)}</p>
                                                    {relProduct.categories && relProduct.categories.length > 0 && (
                                                        <div className="card-categories">
                                                            {relProduct.categories.slice(0, 2).map((category, idx) => (
                                                                <IonChip key={idx} className="small-chip">
                                                                    <IonLabel>{category.name}</IonLabel>
                                                                </IonChip>
                                                            ))}
                                                            {relProduct.categories.length > 2 && (
                                                                <span className="more-categories">+{relProduct.categories.length - 2} más</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {relatedProducts.length === 0 &&
                                    !relatedProductsLoading &&
                                    product &&
                                    product.categories &&
                                    product.categories.length > 0 && (
                                        <p className="no-related-products">
                                            No se encontraron productos relacionados en las mismas categorías.
                                        </p>
                                    )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="modern-error-container">
                        <div className="error-icon">🔍</div>
                        <h3>Producto no encontrado</h3>
                        <p>No se encontró el producto solicitado.</p>
                        <IonButton onClick={() => history.goBack()} className="retry-button">
                            Volver
                        </IonButton>
                    </div>
                )}
            </IonContent>
        </IonPage>
    )
}

export default ProductDetailPage

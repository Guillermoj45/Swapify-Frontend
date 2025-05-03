import React, { useState, useEffect } from 'react';
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
    IonAvatar
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
    heart,
    heartOutline,
    shareOutline,
    chatbubbleOutline,
    timeOutline,
    locationOutline,
    personOutline,
    sunny,
    moon,
    starOutline
} from 'ionicons/icons';
import { ProductService, Product } from '../../Services/ProductService';
import './ProductDetailPage.css';

interface ProductDetailPageParams {
    id: string;
    profileId: string; // Added profileId parameter
}

const ProductDetailPage: React.FC = () => {
    const { id, profileId } = useParams<ProductDetailPageParams>();
    const history = useHistory();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

    // Check user's preferred color scheme on component mount
    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);

        // Apply theme class to body
        document.body.classList.toggle('dark-theme', prefersDark);
    }, []);

    // Apply dark mode class when darkMode state changes
    useEffect(() => {
        document.body.classList.toggle('dark-theme', darkMode);
    }, [darkMode]);

    // Fetch product data
    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                setLoading(true);

                // Use the profile ID from URL parameters
                // If profileId is not available in URL, fall back to session storage
                const effectiveProfileId = profileId || sessionStorage.getItem('profileId') || 'f708820d-a3eb-43ba-b9d0-e9bc749ae686';

                // Fetch the product using the real service
                const productData = await ProductService.getProductById(id, effectiveProfileId);
                setProduct(productData);

                // Fetch related products in a real app
                // Here we'll use dummy data
                setRelatedProducts([]);

                // Try to fetch related products based on categories
                try {
                    // This would be a real API call in production
                    // For now, we're just simulating it
                    setTimeout(() => {
                        const mockRelatedProducts: Product[] = Array(4).fill(null).map((_, index) => ({
                            id: `rel-${id}-${index}`,
                            name: `Producto relacionado ${index + 1}`,
                            description: `Descripción corta del producto relacionado ${index + 1}.`,
                            points: Math.floor(Math.random() * 5) + 1,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            imagenes: [],
                            profile: productData.profile,
                            categories: []
                        }));
                        setRelatedProducts(mockRelatedProducts);
                    }, 500);
                } catch (relatedErr) {
                    console.error('Error fetching related products:', relatedErr);
                    // Don't set an error - it's not critical
                }

                setLoading(false);
            } catch (err) {
                console.error('Error al cargar los detalles del producto:', err);
                setError('No se pudieron cargar los detalles del producto');
                setLoading(false);
                setShowToast(true);
            }
        };

        fetchProductDetail();
    }, [id, profileId]);

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    // Toggle favorite state
    const toggleFavorite = () => {
        setIsFavorite(prev => !prev);
    };

    // Format date to a readable string
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Función para formatear los puntos como "X anuncios"
    const formatPoints = (points: number): string => {
        if (points < 0) return "Sin valoración";
        return `${points} puntos`;
    };

    // Calculate time since creation
    const getTimeSince = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Hoy";
        if (diffDays === 1) return "Ayer";
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
        }
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
        }
        const years = Math.floor(diffDays / 365);
        return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
    };

    // Function to get the Cloudinary URL
    const getImageUrl = (cloudinaryId: string): string => {
        // Replace with your actual Cloudinary configuration
        return `https://res.cloudinary.com/yourcloudname/image/upload/${cloudinaryId}`;
    };

    // Handle image navigation
    const nextImage = () => {
        if (product && product.imagenes && product.imagenes.length > 0) {
            setCurrentImageIndex((currentImageIndex + 1) % product.imagenes.length);
        }
    };

    const prevImage = () => {
        if (product && product.imagenes && product.imagenes.length > 0) {
            setCurrentImageIndex((currentImageIndex - 1 + product.imagenes.length) % product.imagenes.length);
        }
    };

    return (
        <IonPage className={`product-detail-page ${darkMode ? 'dark-theme' : 'light-theme'}`}>
            <IonHeader>
                <IonToolbar className={`shopify-toolbar ${darkMode ? 'dark-toolbar' : ''}`}>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/products" />
                    </IonButtons>
                    <IonTitle>Detalles del producto</IonTitle>
                    <IonButtons slot="end">
                        <IonButton className="theme-toggle-button" onClick={toggleDarkMode}>
                            <IonIcon icon={darkMode ? sunny : moon} />
                        </IonButton>
                        <IonButton>
                            <IonIcon icon={shareOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                {/* Toast para errores */}
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={error || "Ocurrió un error"}
                    duration={3000}
                    position="bottom"
                    color="danger"
                />

                {loading ? (
                    <div className="loading-container">
                        <IonSpinner name="circular" />
                        <p>Cargando detalles del producto...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p>No se pudieron cargar los detalles del producto. Inténtalo de nuevo más tarde.</p>
                        <IonButton onClick={() => window.location.reload()}>Reintentar</IonButton>
                    </div>
                ) : product ? (
                    <div className="product-detail-container">
                        {/* Imagen del producto */}
                        <div className="product-detail-image-container">
                            {product.imagenes && product.imagenes.length > 0 ? (
                                <>
                                    <img
                                        src={getImageUrl(product.imagenes[currentImageIndex])}
                                        alt={product.name}
                                        className="product-detail-image"
                                        onError={(e) => {
                                            // Fallback si la imagen no carga
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = `https://via.placeholder.com/400x300/${product.id.substring(0, 6)}/FFFFFF?text=${product.name.charAt(0)}`;
                                        }}
                                    />
                                    {product.imagenes.length > 1 && (
                                        <div className="image-navigation">
                                            <button onClick={prevImage} className="nav-button prev">&lt;</button>
                                            <div className="image-indicators">
                                                {product.imagenes.map((_, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`indicator ${idx === currentImageIndex ? 'active' : ''}`}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                    ></span>
                                                ))}
                                            </div>
                                            <button onClick={nextImage} className="nav-button next">&gt;</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div
                                    className="product-detail-image product-detail-image-placeholder"
                                    style={{
                                        backgroundColor: `#${product.id.substring(0, 6)}`,
                                        minHeight: '300px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: '3rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {product.name.charAt(0)}
                                </div>
                            )}
                            <div className="product-detail-favorite">
                                <IonButton
                                    fill="clear"
                                    className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
                                    onClick={toggleFavorite}
                                >
                                    <IonIcon slot="icon-only" icon={isFavorite ? heart : heartOutline} />
                                </IonButton>
                            </div>
                        </div>

                        {/* Detalles del producto */}
                        <div className="product-detail-info">
                            <h1 className="product-detail-title">{product.name}</h1>
                            <div className="product-detail-meta">
                                <div className="product-detail-rating">
                                    <IonIcon icon={starOutline} />
                                    <span>{formatPoints(product.points)}</span>
                                </div>
                                <div className="product-detail-time">
                                    <IonIcon icon={timeOutline} />
                                    <span>{getTimeSince(product.createdAt)}</span>
                                </div>
                            </div>

                            {/* Chips de categorías */}
                            <div className="product-detail-categories">
                                {product.categories && product.categories.length > 0 ? (
                                    product.categories.map((category, idx) => (
                                        <IonChip key={idx} color="primary">
                                            <IonLabel>{category.name}</IonLabel>
                                        </IonChip>
                                    ))
                                ) : (
                                    <IonChip color="medium">
                                        <IonLabel>Sin categoría</IonLabel>
                                    </IonChip>
                                )}
                            </div>

                            {/* Descripción */}
                            <div className="product-detail-description">
                                <h2>Descripción</h2>
                                <p>{product.description}</p>
                            </div>

                            {/* Fechas de creación y actualización */}
                            <div className="product-detail-dates">
                                <div className="date-item">
                                    <span className="date-label">Publicado:</span>
                                    <span className="date-value">{formatDate(product.createdAt)}</span>
                                </div>
                                {product.createdAt !== product.updatedAt && (
                                    <div className="date-item">
                                        <span className="date-label">Actualizado:</span>
                                        <span className="date-value">{formatDate(product.updatedAt)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Información de usuario */}
                            <div className="product-detail-user">
                                {product.profile && (
                                    <>
                                        <div className="user-avatar">
                                            {product.profile.avatar ? (
                                                <IonAvatar>
                                                    <img
                                                        src={getImageUrl(product.profile.avatar)}
                                                        alt={product.profile.nickname}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.onerror = null;
                                                            target.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                                                        }}
                                                    />
                                                </IonAvatar>
                                            ) : (
                                                <IonIcon icon={personOutline} />
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <h3>Vendedor</h3>
                                            <p>{product.profile.nickname}</p>
                                            {product.profile.premium !== "FREE" && (
                                                <IonBadge color="warning">{product.profile.premium}</IonBadge>
                                            )}
                                            {product.profile.newUser && (
                                                <IonBadge color="success">Nuevo</IonBadge>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Ubicación - Este campo no viene del backend, se podría añadir si se implementa */}
                            <div className="product-detail-location">
                                <IonIcon icon={locationOutline} />
                                <span>Ubicación no especificada</span>
                            </div>

                            {/* Botones de acción */}
                            <div className="product-detail-actions">
                                <IonButton
                                    expand="block"
                                    className="main-action-button"
                                    onClick={() => {
                                        // Aquí iría la lógica para iniciar un chat con el vendedor
                                        history.push(`/Chat?profileId=${product.profile.id}&productId=${product.id}`);
                                    }}
                                >
                                    Contactar
                                </IonButton>
                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    className="secondary-action-button"
                                    onClick={() => {
                                        // Aquí iría la lógica para hacer una pregunta
                                        history.push(`/Chat?profileId=${product.profile.id}&productId=${product.id}&question=true`);
                                    }}
                                >
                                    <IonIcon slot="start" icon={chatbubbleOutline} />
                                    Hacer una pregunta
                                </IonButton>
                            </div>
                        </div>

                        {/* Productos relacionados */}
                        {relatedProducts.length > 0 && (
                            <div className="related-products">
                                <h2>Productos relacionados</h2>
                                <div className="items-scroll-container">
                                    {relatedProducts.map((relProduct) => (
                                        <div key={relProduct.id} className="product-card" onClick={() => {
                                            // Update the link to include the profile ID when navigating to related products
                                            history.push(`/product/${relProduct.id}/${relProduct.profile.id}`);
                                        }}>
                                            <div className="product-image">
                                                {relProduct.imagenes && relProduct.imagenes.length > 0 ? (
                                                    <img
                                                        src={getImageUrl(relProduct.imagenes[0])}
                                                        alt={relProduct.name}
                                                        className="product-image-img"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.onerror = null;
                                                            target.src = `https://via.placeholder.com/150x150/${relProduct.id.substring(0, 6)}/FFFFFF?text=${relProduct.name.charAt(0)}`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="product-image-placeholder"
                                                        style={{
                                                            backgroundColor: `#${relProduct.id.substring(0, 6)}`,
                                                            minHeight: '150px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#fff',
                                                            fontSize: '1.5rem',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {relProduct.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="favorite-button">
                                                    <IonIcon icon={heartOutline} />
                                                </div>
                                            </div>
                                            <div className="product-info">
                                                <h3 className="product-name">{relProduct.name}</h3>
                                                <p className="product-points">{formatPoints(relProduct.points)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="error-container">
                        <p>No se encontró el producto.</p>
                        <IonButton onClick={() => history.goBack()}>Volver</IonButton>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ProductDetailPage;
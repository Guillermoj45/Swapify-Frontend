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
    moon
} from 'ionicons/icons';
import { ProductService, Product } from '../../Services/ProductService';
import './ProductDetailPage.css';

interface ProductDetailPageParams {
    id: string;
}

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<ProductDetailPageParams>();
    const history = useHistory();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

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
                // En un caso real, harías una llamada API para obtener detalles del producto
                // Aquí simulamos datos para este ejemplo

                // Simulación de una llamada al API
                setTimeout(() => {
                    // Crear un producto simulado basado en el ID
                    const mockProduct: Product = {
                        id: id,
                        name: `Producto ${id.substring(0, 5)}`,
                        description: `Este es un producto de ejemplo con ID ${id}. Aquí iría una descripción completa del producto, incluyendo sus características, estado de conservación y otros detalles relevantes para los compradores potenciales. El vendedor ha añadido toda la información necesaria para que puedas tomar una decisión informada.`,
                        points: 4.5,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    setProduct(mockProduct);

                    // También simulamos productos relacionados
                    const mockRelatedProducts: Product[] = Array(4).fill(null).map((_, index) => ({
                        id: `rel-${id}-${index}`,
                        name: `Producto relacionado ${index + 1}`,
                        description: `Descripción corta del producto relacionado ${index + 1}.`,
                        points: Math.floor(Math.random() * 5) + 1,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }));

                    setRelatedProducts(mockRelatedProducts);
                    setLoading(false);
                }, 800); // Simulamos un tiempo de carga

            } catch (err) {
                console.error('Error al cargar los detalles del producto:', err);
                setError('No se pudieron cargar los detalles del producto');
                setLoading(false);
                setShowToast(true);
            }
        };

        fetchProductDetail();
    }, [id]);

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    // Toggle favorite state
    const toggleFavorite = () => {
        setIsFavorite(prev => !prev);
    };

    // Función para formatear los puntos como "X anuncios"
    const formatPoints = (points: number): string => {
        if (points < 0) return "Sin valoración";
        return `${points} puntos`;
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
                            <div
                                className="product-detail-image"
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
                                    <span>{formatPoints(product.points)}</span>
                                </div>
                                <div className="product-detail-time">
                                    <IonIcon icon={timeOutline} />
                                    <span>Publicado hace 2 días</span>
                                </div>
                            </div>

                            {/* Chips de categorías */}
                            <div className="product-detail-categories">
                                <IonChip color="primary">
                                    <IonLabel>Hogar</IonLabel>
                                </IonChip>
                                <IonChip color="primary">
                                    <IonLabel>Segunda mano</IonLabel>
                                </IonChip>
                            </div>

                            {/* Descripción */}
                            <div className="product-detail-description">
                                <h2>Descripción</h2>
                                <p>{product.description}</p>
                            </div>

                            {/* Información de usuario */}
                            <div className="product-detail-user">
                                <div className="user-avatar">
                                    <IonIcon icon={personOutline} />
                                </div>
                                <div className="user-info">
                                    <h3>Vendedor</h3>
                                    <p>Usuario12345</p>
                                </div>
                            </div>

                            {/* Ubicación */}
                            <div className="product-detail-location">
                                <IonIcon icon={locationOutline} />
                                <span>Madrid, España</span>
                            </div>

                            {/* Botones de acción */}
                            <div className="product-detail-actions">
                                <IonButton
                                    expand="block"
                                    className="main-action-button"
                                >
                                    Contactar
                                </IonButton>
                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    className="secondary-action-button"
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
                                            history.push(`/product/${relProduct.id}`);
                                        }}>
                                            <div className="product-image">
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
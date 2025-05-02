import React, { useState, useEffect, useRef } from 'react';
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonButtons,
    IonMenuButton,
    IonIcon,
    IonButton,
    IonSpinner,
    IonToast
} from '@ionic/react';
import {
    chevronForward,
    heart,
    options,
    notificationsOutline,
    add,
    sunny,
    moon
} from 'ionicons/icons';
import Navegation from "../../components/Navegation";
import './ProductsPage.css';
import { useHistory, useLocation } from "react-router-dom";
import { ProductService, RecommendDTO, Product } from '../../Services/ProductService';

interface CustomLocationState {
    token?: string;
}

const ProductsPage = () => {
    const history = useHistory();
    const location = useLocation<CustomLocationState>();

    const [searchText, setSearchText] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('Hogar');
    const [isDesktop, setIsDesktop] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const sliderRef = useRef<HTMLDivElement | null>(null);

    // Estado para almacenar los datos del backend
    const [recommendedData, setRecommendedData] = useState<RecommendDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<boolean>(false);

    useEffect(() => {
        const mensaje = new URLSearchParams(location.search).get('token');
        if (mensaje){
            sessionStorage.setItem("token", mensaje);
            history.push("/products");
        }

        if (!sessionStorage.getItem("token")) {
            history.push("/login");
        }
    }, [history, location]);

    // Cargar datos recomendados del backend
    useEffect(() => {
        const fetchRecommendedProducts = async () => {
            try {
                setLoading(true);
                const data = await ProductService.getRecommendedProducts();

                // Log para depuración - revisemos la estructura de los datos
                console.log("Datos recibidos del backend:", data);

                setRecommendedData(data);
                setLoading(false);
            } catch (error) {
                console.error('Error al cargar productos recomendados:', error);
                setError('No se pudieron cargar los productos recomendados');
                setLoading(false);
                setShowToast(true);
            }
        };

        fetchRecommendedProducts();
    }, []);

    // Comprobar el ancho de la pantalla
    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const handleResize = (e: MediaQueryListEvent) => {
            setIsDesktop(e.matches);
        };
        setIsDesktop(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleResize);
        return () => {
            mediaQuery.removeEventListener('change', handleResize);
        };
    }, []);

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

    // Auto-scroll del slider
    useEffect(() => {
        const timer = setInterval(() => {
            if (sliderItems.length > 0) {
                setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
            }
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Efecto para mover el slider cuando cambie el slide actual
    useEffect(() => {
        if (sliderRef.current) {
            const scrollAmount = sliderRef.current.offsetWidth * currentSlide;
            sliderRef.current.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    }, [currentSlide]);

    // Handle manual scroll
    const handleScroll = () => {
        if (sliderRef.current) {
            const scrollPosition = sliderRef.current.scrollLeft;
            const slideWidth = sliderRef.current.offsetWidth;
            const newSlide = Math.round(scrollPosition / slideWidth);
            if (newSlide !== currentSlide) {
                setCurrentSlide(newSlide);
            }
        }
    };

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    // Elementos del slider
    const sliderItems = [
        {
            id: 1,
            title: 'Compra y vende artículos de segunda mano.',
            description: 'Encuentra productos únicos a precios increíbles.',
            buttonText: 'Vender ahora',
            backgroundColor: darkMode ? '#0d1f15' : '#f1ffe8',
            textColor: darkMode ? '#64ffa9' : '#0e5741',
            buttonColor: darkMode ? '#12b687' : '#0e5741'
        },
        {
            id: 2,
            title: 'Descubre ofertas especiales',
            description: 'Miles de productos con grandes descuentos.',
            buttonText: 'Ver ofertas',
            backgroundColor: darkMode ? '#0d1b30' : '#e8f0ff',
            textColor: darkMode ? '#64aaff' : '#1a56a5',
            buttonColor: darkMode ? '#1a56a5' : '#1a56a5'
        },
        {
            id: 3,
            title: 'Vende lo que ya no usas',
            description: 'Dale una segunda vida a tus objetos y gana dinero extra.',
            buttonText: 'Publicar ahora',
            backgroundColor: darkMode ? '#301a0d' : '#fff0e8',
            textColor: darkMode ? '#ffa964' : '#a54c1a',
            buttonColor: darkMode ? '#a54c1a' : '#a54c1a'
        }
    ];

    // Filtros disponibles
    const filters = ['Hogar', 'Tecnología', 'Deporte', 'Jardín', 'Muebles'];

    // Función para formatear los puntos como "X anuncios"
    const formatPoints = (points: number): string => {
        if (points < 0) return "Sin valoración";
        return `${points} puntos`;
    };

    // Función para truncar y formatear la descripción
    const truncateDescription = (description: string, maxLength: number = 85): string => {
        if (!description) return '';
        if (description.length <= maxLength) return description;

        // Truncar en el último espacio antes del límite para no cortar palabras
        const truncated = description.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');

        return lastSpace === -1 ? `${truncated}...` : `${truncated.substring(0, lastSpace)}...`;
    };

    return (
        <IonPage className={`shopify-page ${darkMode ? 'dark-theme' : 'light-theme'}`} id="main-content">
            <IonHeader className="shopify-header">
                <IonToolbar className={`shopify-toolbar ${darkMode ? 'dark-toolbar' : ''}`}>
                    {isDesktop && (
                        <IonButtons slot="start">
                            <IonMenuButton />
                        </IonButtons>
                    )}
                    <div className="search-container">
                        <IonSearchbar
                            value={searchText}
                            onIonChange={e => setSearchText(e.detail.value ?? '')}
                            placeholder="Buscar"
                            showCancelButton="never"
                            className={`shopify-searchbar ${darkMode ? 'dark-searchbar' : ''}`}
                        />
                        <IonButtons slot="end" className="header-buttons">
                            <IonButton className="theme-toggle-button" onClick={toggleDarkMode}>
                                <IonIcon icon={darkMode ? sunny : moon} />
                            </IonButton>
                            <IonButton className="notifications-button">
                                <IonIcon icon={notificationsOutline} />
                            </IonButton>
                            <IonButton className="options-button">
                                <IonIcon icon={options} />
                            </IonButton>
                        </IonButtons>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent className="wallapop-content">
                {/* Toast para errores */}
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={error || "Ocurrió un error"}
                    duration={3000}
                    position="bottom"
                    color="danger"
                />

                {/* Banner Slider */}
                <div className="slider-container">
                    <div
                        className="slider-track"
                        ref={sliderRef}
                        onScroll={handleScroll}
                    >
                        {sliderItems.map((item) => (
                            <div
                                key={item.id}
                                className="slider-item"
                                style={{ backgroundColor: item.backgroundColor }}
                            >
                                <div className="slider-content">
                                    <div className="slider-text" style={{ color: item.textColor }}>
                                        <h2 className="slider-title">{item.title}</h2>
                                        <p className="slider-description">{item.description}</p>
                                        <button
                                            className="slider-button"
                                            style={{ backgroundColor: item.buttonColor }}
                                        >
                                            <IonIcon icon={add} className="button-icon" />
                                            {item.buttonText}
                                        </button>
                                    </div>
                                    <div className="slider-image">
                                        {/* Placeholder para imagen */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="slider-indicators">
                        {sliderItems.map((_, index) => (
                            <div
                                key={index}
                                className={`slider-indicator ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(index)}
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Chips de filtros */}
                <div className="filters-container">
                    {filters.map((filter) => (
                        <IonChip
                            key={filter}
                            onClick={() => setSelectedFilter(filter)}
                            className={`filter-chip ${selectedFilter === filter ? 'selected' : ''}`}
                        >
                            <IonLabel>{filter}</IonLabel>
                        </IonChip>
                    ))}
                </div>

                {/* Contenido dinámico desde la API */}
                {loading ? (
                    <div className="loading-container">
                        <IonSpinner name="circular" />
                        <p>Cargando productos recomendados...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p>No se pudieron cargar los productos. Inténtalo de nuevo más tarde.</p>
                        <IonButton onClick={() => window.location.reload()}>Reintentar</IonButton>
                    </div>
                ) : (
                    recommendedData && recommendedData.titles.map((title, categoryIndex) => {
                        // Obtener los productos específicos para esta categoría
                        const categoryProducts = recommendedData.products[categoryIndex] || [];

                        // Log para depuración
                        console.log(`Categoría: ${title}, Índice: ${categoryIndex}`);
                        console.log(`Productos para esta categoría:`, categoryProducts);

                        // Solo mostrar categorías que tengan productos
                        if (!categoryProducts || categoryProducts.length === 0) {
                            console.log(`La categoría ${title} no tiene productos, no se mostrará.`);
                            return null;
                        }

                        return (
                            <div key={categoryIndex} className="category-section">
                                <div className="category-header">
                                    <h2 className="section-title">{title}</h2>
                                    <IonButton fill="clear" className="view-all-button">
                                        Ver todo <IonIcon icon={chevronForward} />
                                    </IonButton>
                                </div>

                                {/* Contenedor horizontal con scroll */}
                                <div className="items-scroll-container">
                                    {categoryProducts.map((product: Product) => (
                                        <div key={product.id} className="product-card" onClick={() => {
                                            console.log('Producto seleccionado:', product);
                                        }}>
                                            <div className="product-image">
                                                <div
                                                    className="product-image-placeholder"
                                                    style={{
                                                        backgroundColor: `#${product.id.substring(0, 6)}`,
                                                        minHeight: '150px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontSize: '1.5rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {product.name.charAt(0)}
                                                </div>
                                                <div className="favorite-button">
                                                    <IonIcon icon={heart} />
                                                </div>
                                            </div>
                                            <div className="product-info">
                                                <h3 className="product-name">{product.name}</h3>
                                                <p className="product-points">{formatPoints(product.points)}</p>
                                                <p className="product-description">{truncateDescription(product.description)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </IonContent>
            <Navegation isDesktop={isDesktop} />
        </IonPage>
    );
};

export default ProductsPage;
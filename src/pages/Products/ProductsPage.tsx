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
    IonToast,
    IonList,
    IonItem
} from '@ionic/react';
import {
    chevronForward,
    heart,
    options,
    notificationsOutline,
    add,
    sunny,
    moon,
    search,
    checkmarkCircle
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
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isDesktop, setIsDesktop] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLIonSearchbarElement | null>(null);

    // Estado para almacenar los datos del backend
    const [recommendedData, setRecommendedData] = useState<RecommendDTO | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<boolean>(false);

    // Estado para almacenar las categorías disponibles
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);

    // Agregar este estado para controlar si el slider está en pausa
    const [sliderPaused, setSliderPaused] = useState(false);

// Funciones para pausar/reanudar el slider cuando el usuario interactúa
    const pauseSlider = () => {
        setSliderPaused(true);
    };

    const resumeSlider = () => {
        setSliderPaused(false);
    };

    const handleIndicatorClick = (index: number) => {
        setCurrentSlide(index);

        // Scroll to the selected slide smoothly
        if (sliderRef.current) {
            const scrollAmount = sliderRef.current.offsetWidth * index;
            sliderRef.current.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }

        // Pause slider temporarily when user interacts with indicators
        pauseSlider();
        setTimeout(resumeSlider, 5000); // Resume auto-sliding after 5 seconds
    };


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

                // Extraer categorías únicas de los productos
                const categories = new Set<string>(); // Fixed: changed 'let' to 'const'

                // Combinar todos los productos en un solo array para la búsqueda
                if (data && data.products) {
                    // Extraer categorías de los títulos
                    data.titles.forEach(title => {
                        categories.add(title);
                    });

                    const combinedProducts = data.products.flat();
                    setAllProducts(combinedProducts);

                    // Nota: No accedemos a product.category ya que no existe en el tipo Product
                    // En lugar de eso, podemos usar los títulos como categorías como ya se hace arriba

                    setAvailableCategories(Array.from(categories));
                }

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

    // Función para buscar productos mientras se escribe
    const searchProducts = (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        const results = allProducts.filter(product =>
            product.name.toLowerCase().includes(normalizedQuery)
        );

        setSearchResults(results.slice(0, 5)); // Limitamos a 5 resultados para las sugerencias
    };

    // Actualizar resultados de búsqueda mientras se escribe
    useEffect(() => {
        searchProducts(searchText);
        // Solo mostrar sugerencias si hay texto y resultados
        setShowSearchResults(!!searchText && searchResults.length > 0);
    }, [searchText, allProducts, searchResults.length]);

    // Función para manejar la búsqueda completa
    const handleSearch = (query: string) => {
        setIsSearching(true);
        const normalizedQuery = query.toLowerCase().trim();

        if (!normalizedQuery) {
            setFilteredProducts([]);
            setIsSearching(false);
            return;
        }

        const filtered = allProducts.filter(product =>
            product.name.toLowerCase().includes(normalizedQuery)
        );

        setFilteredProducts(filtered);
        setShowSearchResults(false); // Ocultar sugerencias después de buscar
    };

    // Función para manejar el evento Enter en la búsqueda
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(searchText);
        }
    };

    // Función para seleccionar una sugerencia
    const handleSelectSuggestion = (product: Product) => {
        setSearchText(product.name);
        handleSearch(product.name);
        setShowSearchResults(false);
    };

    // Manejador para cambios en el texto de búsqueda
    const handleSearchChange = (e: CustomEvent) => {
        const value = e.detail.value || '';
        setSearchText(value);
    };

    // Función para cerrar las sugerencias cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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

    // Efecto para configurar el auto-scroll del slider
    useEffect(() => {
        let timer = null;

        // Solo configurar el temporizador si no está en modo de búsqueda y no está pausado
        if (!isSearching && !sliderPaused) {
            timer = setInterval(() => {
                if (sliderItems.length > 0) {
                    setCurrentSlide((prev) => {
                        const nextSlide = (prev + 1) % sliderItems.length;

                        // Asegurarnos de desplazar el slider cuando cambia el currentSlide
                        if (sliderRef.current) {
                            const scrollAmount = sliderRef.current.offsetWidth * nextSlide;
                            sliderRef.current.scrollTo({
                                left: scrollAmount,
                                behavior: 'smooth'
                            });
                        }

                        return nextSlide;
                    });
                }
            }, 5000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [sliderItems.length, isSearching, sliderPaused]);

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

    // Limpiar búsqueda y volver a mostrar los productos recomendados
    const clearSearch = () => {
        setSearchText('');
        setFilteredProducts([]);
        setIsSearching(false);
        setShowSearchResults(false);
    };

    // Función para manejar selección/deselección de categorías
    const toggleCategoryFilter = (category: string) => {
        setSelectedCategories(prevSelected => {
            if (prevSelected.includes(category)) {
                // Si ya está seleccionada, quitarla
                return prevSelected.filter(cat => cat !== category);
            } else {
                // Si no está seleccionada, añadirla
                return [...prevSelected, category];
            }
        });
    };

    // Filtrar productos por categorías seleccionadas
    useEffect(() => {
        if (selectedCategories.length === 0) {
            // Si no hay categorías seleccionadas, no aplicamos filtro
            setIsSearching(false);
            setFilteredProducts([]);
            return;
        }

        setIsSearching(true);

        // Filtrar productos que pertenezcan a las categorías seleccionadas
        // Asumiendo que los productos están organizados por categorías en recommendedData
        let filtered: Product[] = [];

        if (recommendedData && recommendedData.titles && recommendedData.products) {
            recommendedData.titles.forEach((title, index) => {
                if (selectedCategories.includes(title) && recommendedData.products[index]) {
                    filtered = [...filtered, ...recommendedData.products[index]];
                }
            });
        }

        setFilteredProducts(filtered);
    }, [selectedCategories, recommendedData]);

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
                    <div className="search-container" ref={searchContainerRef}>
                        <IonSearchbar
                            ref={searchInputRef}
                            value={searchText}
                            onIonInput={handleSearchChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Buscar productos"
                            showCancelButton="focus"
                            onIonCancel={clearSearch}
                            onIonClear={clearSearch}
                            className={`shopify-searchbar ${darkMode ? 'dark-searchbar' : ''}`}
                        />
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="search-suggestions">
                                <IonList>
                                    {searchResults.map((product) => (
                                        <IonItem key={product.id} onClick={() => handleSelectSuggestion(product)}>
                                            <IonIcon icon={search} slot="start" />
                                            <IonLabel>{product.name}</IonLabel>
                                        </IonItem>
                                    ))}
                                </IonList>
                            </div>
                        )}
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

                {isSearching && searchText && (
                    <div className="search-results-header">
                        <h2>Resultados para "{searchText}"</h2>
                        <IonButton fill="clear" onClick={clearSearch}>
                            Volver
                        </IonButton>
                    </div>
                )}

                {isSearching && selectedCategories.length > 0 && !searchText && (
                    <div className="search-results-header">
                        <h2>Filtrado por categorías: {selectedCategories.join(', ')}</h2>
                        <IonButton fill="clear" onClick={() => setSelectedCategories([])}>
                            Limpiar filtros
                        </IonButton>
                    </div>
                )}

                {!isSearching && (
                    <>
                        {/* Banner Slider - Solo mostrar si no estamos buscando */}
                        <div className="slider-container">
                            <div
                                className="slider-track"
                                ref={sliderRef}
                                onScroll={handleScroll}
                                onMouseEnter={pauseSlider}
                                onMouseLeave={resumeSlider}
                                onTouchStart={pauseSlider}
                                onTouchEnd={resumeSlider}
                            >
                                {sliderItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="slider-item"
                                        style={{ backgroundColor: item.backgroundColor }}
                                    >
                                        <div className="slider-content">
                                            <div className="slider-text" style={{color: item.textColor}}>
                                                <h2 className="slider-title">{item.title}</h2>
                                                <p className="slider-description">{item.description}</p>
                                                <button
                                                    className="slider-button"
                                                    style={{backgroundColor: item.buttonColor}}
                                                >
                                                    <IonIcon icon={add} className="button-icon"/>
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
                                        onClick={() => handleIndicatorClick(index)}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Chips de filtros - Mostrar siempre para permitir filtrado */}
                <div className="filters-container">
                    {loading ? (
                        <IonChip disabled>
                            <IonSpinner name="crescent" />
                            <IonLabel>Cargando categorías...</IonLabel>
                        </IonChip>
                    ) : (
                        availableCategories.map((category) => (
                            <IonChip
                                key={category}
                                onClick={() => toggleCategoryFilter(category)}
                                className={`filter-chip ${selectedCategories.includes(category) ? 'selected' : ''}`}
                            >
                                {selectedCategories.includes(category) && (
                                    <IonIcon icon={checkmarkCircle} className="category-selected-icon" />
                                )}
                                <IonLabel>{category}</IonLabel>
                            </IonChip>
                        ))
                    )}
                </div>

                {/* Contenido dinámico basado en la búsqueda o los datos recomendados */}
                {loading ? (
                    <div className="loading-container">
                        <IonSpinner name="circular" />
                        <p>Cargando productos...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p>No se pudieron cargar los productos. Inténtalo de nuevo más tarde.</p>
                        <IonButton onClick={() => window.location.reload()}>Reintentar</IonButton>
                    </div>
                ) : isSearching && filteredProducts.length > 0 ? (
                    // Mostrar resultados de búsqueda
                    <div className="search-results">
                        <div className="products-grid">
                            {filteredProducts.map((product) => (
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
                ) : isSearching && filteredProducts.length === 0 ? (
                    // Mostrar mensaje cuando no hay resultados
                    <div className="no-results">
                        {searchText ? (
                            <p>No se encontraron productos que coincidan con "{searchText}"</p>
                        ) : (
                            <p>No se encontraron productos en las categorías seleccionadas</p>
                        )}
                        <IonButton onClick={() => {
                            clearSearch();
                            setSelectedCategories([]);
                        }}>Ver todos los productos</IonButton>
                    </div>
                ) : (
                    // Mostrar productos recomendados
                    recommendedData && recommendedData.titles.map((title, categoryIndex) => {
                        // Obtener los productos específicos para esta categoría
                        const categoryProducts = recommendedData.products[categoryIndex] || [];

                        // Solo mostrar categorías que tengan productos
                        if (!categoryProducts || categoryProducts.length === 0) {
                            return null;
                        }

                        return (
                            <div key={categoryIndex} className="category-section">
                                <div className="category-header">
                                    <h2 className="section-title">{title}</h2>
                                    <IonButton
                                        fill="clear"
                                        className="view-all-button"
                                        onClick={() => toggleCategoryFilter(title)}
                                    >
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
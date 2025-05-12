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
    IonItem,
    IonBadge,
} from '@ionic/react';
import {
    chevronForward,
    heart,
    heartOutline,
    add,
    search,
    checkmarkCircle,
    arrowForward,
    arrowBack,
    star,
    starOutline
} from 'ionicons/icons';
import './ProductsPage.css';
import { useHistory, useLocation } from "react-router-dom";
import { ProductService, RecommendDTO, Product } from '../../Services/ProductService';
import { ProfileService, SaveProductDTO } from '../../Services/ProfileService';
import SwitchDark from "../../components/UIVerseSwitch/SwitchDark";
import { Settings as SettingsService } from '../../Services/SettingsService';

interface CustomLocationState {
    token?: string;
}

// Define types for slider items
interface SliderItem {
    id: number;
    title: string;
    description: string;
    buttonText: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
}

// Define types for slider ref
interface SliderRef extends HTMLDivElement {
    dataset: {
        touchStartX?: string;
        touchStartScrollX?: string;
    }
}

// Define type for image indexes
interface ImageIndexes {
    [key: string]: number;
}

// Define type for favorites
interface Favorites {
    [key: string]: boolean;
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
    const sliderRef = useRef<SliderRef | null>(null);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLIonSearchbarElement | null>(null);

    // State to store backend data
    const [recommendedData, setRecommendedData] = useState<RecommendDTO | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastColor, setToastColor] = useState<string>('danger');

    // State to track user's favorite products
    const [favorites, setFavorites] = useState<Favorites>({});
    const [savingFavorite, setSavingFavorite] = useState<boolean>(false);
    const [profileId, setProfileId] = useState<string>('');

    // State to store available categories
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);

    // State to track current image for each product
    const [currentImages, setCurrentImages] = useState<ImageIndexes>({});

    // Add this state to control if the slider is paused
    const [sliderPaused, setSliderPaused] = useState(false);

    // Functions to pause/resume the slider when the user interacts
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

    // Function to handle image navigation
    const navigateProductImage = (
        productId: string,
        direction: 'next' | 'prev',
        totalImages: number,
        e: React.MouseEvent
    ) => {
        // Stop event from bubbling to parent elements
        e.stopPropagation();

        setCurrentImages(prev => {
            const currentIndex = prev[productId] || 0;
            let newIndex;

            if (direction === 'next') {
                newIndex = (currentIndex + 1) % totalImages;
            } else {
                newIndex = (currentIndex - 1 + totalImages) % totalImages;
            }

            return {
                ...prev,
                [productId]: newIndex
            };
        });

        // Pause slider temporarily when user interacts with product images
        pauseSlider();
        setTimeout(resumeSlider, 5000);
    };

    // Function to handle favorite/save product
    const handleToggleFavorite = async (productId: string, productProfileId: string, e: React.MouseEvent) => {
        // Stop event from bubbling to parent elements
        e.stopPropagation();

        if (savingFavorite) return; // Prevent multiple clicks while processing

        try {
            setSavingFavorite(true);

            // Create data object for API call
            const saveProductDTO: SaveProductDTO = {
                productId: productId,
                profileId: productProfileId
            };

            if (favorites[productId]) {
                // If already favorited, remove from favorites
                const response = await ProfileService.deleteProductFromProfile(saveProductDTO);

                if (response.success) {
                    setFavorites(prev => ({
                        ...prev,
                        [productId]: false
                    }));

                    showToastMessage('Producto eliminado de favoritos', 'success');
                } else {
                    showToastMessage(response.message || 'Error al eliminar de favoritos', 'danger');
                }
            } else {
                // If not favorited, add to favorites
                const response = await ProfileService.saveProductToProfile(saveProductDTO);

                if (response.success) {
                    setFavorites(prev => ({
                        ...prev,
                        [productId]: true
                    }));

                    showToastMessage('Producto guardado en favoritos', 'success');
                } else {
                    showToastMessage(response.message || 'Error al guardar en favoritos', 'danger');
                }
            }
        } catch (error) {
            console.error('Error managing favorite:', error);
            showToastMessage('Error al procesar la solicitud', 'danger');
        } finally {
            setSavingFavorite(false);
        }
    };

    // Helper function to show toast messages
    const showToastMessage = (message: string, color: string = 'danger') => {
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
    };

    // Function to get the Cloudinary URL for an image
    const getImageUrl = (imagePath: string | null): string | null => {
        if (!imagePath) return null;

        try {
            // Replace with your Cloudinary configuration
            return imagePath;
        } catch (error) {
            console.error("Error generating image URL:", error);
            return null;
        }
    };

    // Load user profile and saved products
    useEffect(() => {
        const loadUserProfile = async () => {
            // Obtener el valor del modo oscuro del sessionStorage
            const modoOscuroStorage = sessionStorage.getItem('modoOscuroClaro');

            if (modoOscuroStorage === null) {
                // Si no hay valor en sessionStorage, llamar al backend
                try {
                    const modoOscuroBackend = await SettingsService.getModoOcuro();
                    const modoOscuroFinal = modoOscuroBackend === true;
                    sessionStorage.setItem('modoOscuroClaro', modoOscuroFinal.toString());
                    setDarkMode(modoOscuroFinal);
                } catch (error) {
                    console.error('Error al obtener modo oscuro del backend:', error);
                    // Valor por defecto en caso de error
                    sessionStorage.setItem('modoOscuroClaro', 'false');
                    setDarkMode(false);
                }
            } else {
                // Usar el valor almacenado en sessionStorage
                setDarkMode(modoOscuroStorage === 'true');
            }

            try {
                const profileData = await ProfileService.getProfileInfo();
                setProfileId(profileData.id);

                // Cargar productos guardados
                const savedProducts = await ProfileService.getSavedProducts();
                const favoritesMap: Favorites = {};
                savedProducts.forEach(product => {
                    favoritesMap[product.id] = true;
                });
                setFavorites(favoritesMap);
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        };

        if (sessionStorage.getItem("token")) {
            loadUserProfile();
        }
    }, []);

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

    // Load recommended data from backend
    useEffect(() => {
        const fetchRecommendedProducts = async () => {
            try {
                setLoading(true);
                const data = await ProductService.getRecommendedProducts();

                // Debug log - check data structure
                console.log("Data received from backend:", data);

                setRecommendedData(data);

                // Extract unique categories
                const categories = new Set<string>();

                // Combine all products into a single array for search
                if (data && data.products) {
                    // Extract categories from titles
                    data.titles.forEach(title => {
                        categories.add(title);
                    });

                    const combinedProducts = data.products.flat();
                    setAllProducts(combinedProducts);

                    // Initialize current image index for each product
                    const initialImageIndexes: ImageIndexes = {};
                    combinedProducts.forEach(product => {
                        initialImageIndexes[product.id] = 0;
                    });
                    setCurrentImages(initialImageIndexes);

                    setAvailableCategories(Array.from(categories));
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading recommended products:', err);
                setError('Could not load recommended products');
                setLoading(false);
                showToastMessage('No se pudieron cargar los productos recomendados');
            }
        };

        fetchRecommendedProducts();
    }, []);

    // Function to search products while typing
    const searchProducts = (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        const results = allProducts.filter(product =>
            product.name.toLowerCase().includes(normalizedQuery)
        );

        setSearchResults(results.slice(0, 5)); // Limit to 5 results for suggestions
    };

    // Update search results while typing
    useEffect(() => {
        searchProducts(searchText);
        // Only show suggestions if there is text and results
        setShowSearchResults(!!searchText && searchResults.length > 0);
    }, [searchText, allProducts, searchResults.length]);

    // Function to handle complete search
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
        setShowSearchResults(false); // Hide suggestions after search
    };

    const handleProductImageClick = (
        productId: string,
        totalImages: number,
        e: React.MouseEvent
    ) => {
        // Only navigate image if clicking directly on the image container, not on the nav buttons
        if (!(e.target as Element).closest('.image-nav-button') &&
            !(e.target as Element).closest('.favorite-button')) {
            navigateProductImage(productId, 'next', totalImages, e);
        }
    };

    // Function to handle Enter key press in search
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(searchText);
        }
    };

    // Function to select a suggestion
    const handleSelectSuggestion = (product: Product) => {
        setSearchText(product.name);
        handleSearch(product.name);
        setShowSearchResults(false);
    };

    // Handler for search text changes
    const handleSearchChange = (e: CustomEvent) => {
        const value = e.detail.value || '';
        setSearchText(value);
    };

    // Function to close suggestions when clicking outside
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

    // Check screen width
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

    // Configuración inicial del tema basado en sessionStorage o preferencia del sistema
    useEffect(() => {
        // Obtener el valor del sessionStorage al iniciar
        const modoOscuroStorage = sessionStorage.getItem('modoOscuroClaro');

        // Si existe un valor en sessionStorage, usarlo
        if (modoOscuroStorage !== null) {
            const isDarkMode = modoOscuroStorage === 'true';
            setDarkMode(isDarkMode);
            // Aplicar la clase al body inmediatamente
            document.body.classList.remove('light-theme', 'dark-theme');
            document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
        } else {
            // Si no hay valor en sessionStorage, usar preferencia del sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(prefersDark);
            document.body.classList.remove('light-theme', 'dark-theme');
            document.body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
            // Guardar la preferencia en sessionStorage
            sessionStorage.setItem('modoOscuroClaro', prefersDark.toString());
        }
    }, []);

    interface PreferenceUpdate {
        key: 'modo_oscuro' | 'notificaciones';
        value: boolean;
    }

    const toggleDarkMode = async () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);

        // Actualizar el sessionStorage
        sessionStorage.setItem('modoOscuroClaro', newDarkMode.toString());

        // Aplicar las clases de tema al body
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(newDarkMode ? 'dark-theme' : 'light-theme');

        try {
            // Crear el objeto PreferenceUpdate
            const preferenceUpdate: PreferenceUpdate = {
                key: 'modo_oscuro',
                value: newDarkMode
            };

            // Actualizar en el backend
            await SettingsService.updatePreference(preferenceUpdate);
        } catch (error) {
            console.error('Error al actualizar modo oscuro:', error);
        }
    };

    // Slider items
    const sliderItems: SliderItem[] = [
        {
            id: 1,
            title: 'Buy and sell second-hand items.',
            description: 'Find unique products at incredible prices.',
            buttonText: 'Sell now',
            backgroundColor: darkMode ? '#0d1f15' : '#f1ffe8',
            textColor: darkMode ? '#64ffa9' : '#0e5741',
            buttonColor: darkMode ? '#12b687' : '#0e5741'
        },
        {
            id: 2,
            title: 'Discover special offers',
            description: 'Thousands of products with great discounts.',
            buttonText: 'View offers',
            backgroundColor: darkMode ? '#0d1b30' : '#e8f0ff',
            textColor: darkMode ? '#64aaff' : '#1a56a5',
            buttonColor: darkMode ? '#1a56a5' : '#1a56a5'
        },
        {
            id: 3,
            title: 'Sell what you no longer use',
            description: 'Give your objects a second life and earn extra money.',
            buttonText: 'Post now',
            backgroundColor: darkMode ? '#301a0d' : '#fff0e8',
            textColor: darkMode ? '#ffa964' : '#a54c1a',
            buttonColor: darkMode ? '#a54c1a' : '#a54c1a'
        }
    ];

    // Effect to set up auto-scroll of slider
    useEffect(() => {
        let timer: number | null = null;

        // Only set up the timer if not in search mode and not paused
        if (!isSearching && !sliderPaused) {
            timer = window.setInterval(() => {
                if (sliderItems.length > 0) {
                    setCurrentSlide((prev) => {
                        const nextSlide = (prev + 1) % sliderItems.length;

                        // Make sure to scroll the slider when currentSlide changes
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

            if (newSlide !== currentSlide && newSlide >= 0 && newSlide < sliderItems.length) {
                setCurrentSlide(newSlide);

                // Pause slider temporarily when user manually scrolls
                pauseSlider();
                setTimeout(resumeSlider, 5000);
            }
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        pauseSlider();

        // Store the initial touch position
        if (sliderRef.current) {
            sliderRef.current.dataset.touchStartX = e.touches[0].clientX.toString();
            sliderRef.current.dataset.touchStartScrollX = sliderRef.current.scrollLeft.toString();
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (sliderRef.current && sliderRef.current.dataset.touchStartX) {
            const touchStartX = parseFloat(sliderRef.current.dataset.touchStartX);
            const touchStartScrollX = parseFloat(sliderRef.current.dataset.touchStartScrollX || '0');
            const touchDiff = touchStartX - e.touches[0].clientX;

            // Set scroll position directly for smoother swiping
            sliderRef.current.scrollLeft = touchStartScrollX + touchDiff;
        }
    };

    const handleTouchEnd = () => {
        setTimeout(resumeSlider, 5000);

        // Clean up touch data
        if (sliderRef.current) {
            delete sliderRef.current.dataset.touchStartX;
            delete sliderRef.current.dataset.touchStartScrollX;
        }
    };

    // Clear search and show recommended products again
    const clearSearch = () => {
        setSearchText('');
        setFilteredProducts([]);
        setIsSearching(false);
        setShowSearchResults(false);
    };

    // Function to handle category selection/deselection
    const toggleCategoryFilter = (category: string) => {
        setSelectedCategories(prevSelected => {
            if (prevSelected.includes(category)) {
                // If already selected, remove it
                return prevSelected.filter(cat => cat !== category);
            } else {
                // If not selected, add it
                return [...prevSelected, category];
            }
        });
    };

    // Filter products by selected categories
    useEffect(() => {
        if (selectedCategories.length === 0) {
            // If no categories selected, don't apply filter
            setIsSearching(false);
            setFilteredProducts([]);
            return;
        }

        setIsSearching(true);

        // Filter products that belong to selected categories
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

    // Function to format points
    const formatPoints = (points: number): string => {
        if (points < 0) return "No evaluado";
        return `${points} puntos`;
    };

    // Function to truncate and format description
    const truncateDescription = (description: string | undefined, maxLength: number = 85): string => {
        if (!description) return '';
        if (description.length <= maxLength) return description;

        // Truncate at the last space before the limit to avoid cutting words
        const truncated = description.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');

        return lastSpace === -1 ? `${truncated}...` : `${truncated.substring(0, lastSpace)}...`;
    };

    // Function to format date
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch {
            return 'Invalid date';
        }
    };

    // Function to render premium badge if applicable
    const renderPremiumBadge = (premium: string | undefined) => {
        if (premium === 'PREMIUN') {
            return (
                <IonBadge color="warning" className="premium-badge">
                    <IonIcon icon={star} /> Premium
                </IonBadge>
            );
        }
        return null;
    };

    // Function to render star rating
    const renderStarRating = (points: number) => {
        // Normalize points to a 5-star scale
        // Assuming points are on a scale of 0-1000
        const normalizedRating = Math.min(Math.max(points / 200, 0), 5);
        const fullStars = Math.floor(normalizedRating);
        const hasHalfStar = normalizedRating - fullStars >= 0.5;

        return (
            <div className="star-rating">
                {[...Array(5)].map((_, i) => (
                    <IonIcon
                        key={i}
                        icon={i < fullStars || (i === fullStars && hasHalfStar) ? star : starOutline}
                        className={i < fullStars ? "star-filled" : "star-empty"}
                    />
                ))}
            </div>
        );
    };

    // Function to render a product card with image navigation
    const renderProductCard = (product: Product, isHorizontalScroll: boolean = false) => {
        const currentImageIndex = currentImages[product.id] || 0;
        const hasMultipleImages = product.imagenes && product.imagenes.length > 1;
        const isFavorite = favorites[product.id] || false;

        return (
            <div
                key={product.id}
                className={`product-card ${isHorizontalScroll ? 'horizontal-card' : ''}`}
                onClick={(e) => {
                    // Only navigate to product detail if not clicking on navigation arrows or favorite button
                    if (!(e.target as Element).closest('.image-nav-button') &&
                        !(e.target as Element).closest('.favorite-button')) {
                        console.log('Product selected:', product);
                        history.push(`/product/${product.id}/${product.profile.id}`);
                    }
                }}
            >
                <div className="product-image-container"
                     onClick={(e: React.MouseEvent) => handleProductImageClick(product.id, product.imagenes?.length || 0, e)}>
                    <div className="product-image">
                        {product.imagenes && product.imagenes.length > 0 ? (
                            <img
                                src={getImageUrl(product.imagenes[currentImageIndex]) || ''}
                                alt={product.name}
                                className="product-img"
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23cccccc"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle" fill="%23ffffff"%3E' + product.name.charAt(0) + '%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        ) : (
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
                        )}

                        {hasMultipleImages && (
                            <>
                                <button
                                    className="image-nav-button image-nav-prev"
                                    onClick={(e) => navigateProductImage(product.id, 'prev', product.imagenes?.length || 0, e)}
                                    aria-label="Previous image"
                                >
                                    <IonIcon icon={arrowBack}/>
                                </button>
                                <button
                                    className="image-nav-button image-nav-next"
                                    onClick={(e) => navigateProductImage(product.id, 'next', product.imagenes?.length || 0, e)}
                                    aria-label="Next image"
                                >
                                    <IonIcon icon={arrowForward}/>
                                </button>
                                <div className="image-indicators">
                                    {product.imagenes?.map((_, idx) => (
                                        <span
                                            key={idx}
                                            className={`image-indicator ${idx === currentImageIndex ? 'active' : ''}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <div
                            className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                            onClick={(e) => handleToggleFavorite(product.id, product.profile.id, e)}
                        >
                            <IonIcon icon={isFavorite ? heart : heartOutline} />
                        </div>
                    </div>
                </div>

                <div className="product-info">
                    <div className="product-header">
                        <h3 className="product-name">{product.name}</h3>
                        {product.profile && renderPremiumBadge(product.profile.premium)}
                    </div>

                    <div className="product-rating">
                        {renderStarRating(product.points)}
                        <span className="product-points">{formatPoints(product.points)}</span>
                    </div>

                    <p className="product-description">{truncateDescription(product.description)}</p>

                    <div className="product-meta">
                        <div className="product-profile">
                            {product.profile && (
                                <div className="seller-info">
                                    <span className="seller-name">{product.profile.nickname}</span>
                                    {product.profile.newUser && <span className="new-user-badge">New</span>}
                                </div>
                            )}
                        </div>
                        <div className="product-date">
                            Publicado: {formatDate(product.createdAt)}
                        </div>
                    </div>

                    <div className="product-categories">
                        {product.categories && product.categories.map((category, idx) => (
                            <span key={idx} className="category-tag">
                                {category.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <IonPage className={`shopify-page ${darkMode ? 'dark-theme' : 'light-theme'} ${!isDesktop ? 'has-tab-bar' : ''}`}
                     id="main-content">
                <IonHeader className="shopify-header">
                    <IonToolbar className={`shopify-toolbar ${darkMode ? 'dark-toolbar' : ''}`}>
                        {isDesktop && (
                            <IonButtons slot="start">
                                <IonMenuButton/>
                            </IonButtons>
                        )}
                        <div className="search-container" ref={searchContainerRef}>
                            <IonSearchbar
                                ref={searchInputRef}
                                value={searchText}
                                onIonInput={handleSearchChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Búsqueda de productos"
                                showCancelButton="focus"
                                onIonCancel={clearSearch}
                                onIonClear={clearSearch}
                                className={`shopify-searchbar ${darkMode ? 'dark-searchbar' : ''}`}/>
                            {showSearchResults && searchResults.length > 0 && (
                                <div className="search-suggestions">
                                    <IonList>
                                        {searchResults.map((product) => (
                                            <IonItem key={product.id} onClick={() => handleSelectSuggestion(product)}>
                                                <IonIcon icon={search} slot="start"/>
                                                <IonLabel>{product.name}</IonLabel>
                                            </IonItem>
                                        ))}
                                    </IonList>
                                </div>
                            )}
                            <IonButtons slot="end" className="header-buttons">
                                <IonButton className="theme-toggle-button">
                                    <SwitchDark darkMode={darkMode} toggleDarkMode={toggleDarkMode}/>
                                </IonButton>
                            </IonButtons>
                        </div>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="wallapop-content">
                    {/* Toast for notifications */}
                    <IonToast
                        isOpen={showToast}
                        onDidDismiss={() => setShowToast(false)}
                        message={toastMessage}
                        duration={3000}
                        position="bottom"
                        color={toastColor}
                    />

                    {isSearching && searchText && (
                        <div className="search-results-header">
                            <h2>Results for "{searchText}"</h2>
                        <IonButton fill="clear" onClick={clearSearch}>
                            Back
                        </IonButton>
                    </div>
                )}

                {isSearching && selectedCategories.length > 0 && !searchText && (
                    <div className="search-results-header">
                        <h2>Filtered by categories: {selectedCategories.join(', ')}</h2>
                        <IonButton fill="clear" onClick={() => setSelectedCategories([])}>
                            Limpiar filtros
                        </IonButton>
                    </div>
                )}

                {!isSearching && (
                    <>
                        {/* Banner Slider - Only show if not searching */}
                        <div className="slider-container">
                            <div
                                className={`slider-track ${sliderPaused ? 'paused' : ''}`}
                                ref={sliderRef}
                                onScroll={handleScroll}
                                onMouseEnter={pauseSlider}
                                onMouseLeave={resumeSlider}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                {sliderItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="slider-item"
                                        style={{backgroundColor: item.backgroundColor}}
                                    >
                                        <div className="slider-content">
                                            <div className="slider-text" style={{color: item.textColor}}>
                                                <h2 className="slider-title">{item.title}</h2>
                                                <p className="slider-description">{item.description}</p>
                                                <button
                                                    className="slider-button"
                                                    style={{backgroundColor: item.buttonColor}}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Add navigation or action for this button
                                                        console.log(`Button clicked: ${item.buttonText}`);
                                                    }}
                                                >
                                                    <IonIcon icon={add} className="button-icon"/>
                                                    {item.buttonText}
                                                </button>
                                            </div>
                                            <div className="slider-image">
                                                {/* Here you could add a dynamic image for each slide */}
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

                {/* Filter chips - Show always to allow filtering */}
                <div className="filters-container">
                    {loading ? (
                        <IonChip disabled>
                            <IonSpinner name="crescent"/>
                            <IonLabel>Loading categories...</IonLabel>
                        </IonChip>
                    ) : (
                        availableCategories.map((category) => (
                            <IonChip
                                key={category}
                                onClick={() => toggleCategoryFilter(category)}
                                className={`filter-chip ${selectedCategories.includes(category) ? 'selected' : ''}`}
                            >
                                {selectedCategories.includes(category) && (
                                    <IonIcon icon={checkmarkCircle} className="category-selected-icon"/>
                                )}
                                <IonLabel>{category}</IonLabel>
                            </IonChip>
                        ))
                    )}
                </div>

                {/* Dynamic content based on search or recommended data */}
                {loading ? (
                    <div className="loading-container">
                        <IonSpinner name="circular"/>
                        <p>Loading products...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p>Could not load products. Please try again later.</p>
                        <IonButton onClick={() => window.location.reload()}>Retry</IonButton>
                    </div>
                ) : isSearching && filteredProducts.length > 0 ? (
                    // Show search results
                    <div className="search-results">
                        <div className="products-grid">
                            {filteredProducts.map((product) => (
                                renderProductCard(product, false)
                            ))}
                        </div>
                    </div>
                ) : isSearching && filteredProducts.length === 0 ? (
                    // Show message when there are no results
                    <div className="no-results">
                        {searchText ? (
                            <p>No products found matching "{searchText}"</p>
                        ) : (
                            <p>No products found in the selected categories</p>
                        )}
                        <IonButton onClick={() => {
                            clearSearch();
                            setSelectedCategories([]);
                        }}>Ver todos los productos</IonButton>
                    </div>
                ) : (
                    // Show recommended products
                    recommendedData && recommendedData.titles.map((title, categoryIndex) => {
                        // Get specific products for this category
                        const categoryProducts = recommendedData.products[categoryIndex] || [];

                        // Only show categories that have products
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
                                        Ver todos <IonIcon icon={chevronForward}/>
                                    </IonButton>
                                </div>

                                {/* Horizontal scroll container */}
                                <div className="items-scroll-container">
                                    {categoryProducts.map((product: Product) => (
                                        renderProductCard(product, true)
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </IonContent>
        </IonPage>
        </>
    );
};

export default ProductsPage;
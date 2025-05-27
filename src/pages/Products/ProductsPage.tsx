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
    informationCircleOutline,
    menuOutline,
    funnelOutline,
    closeOutline
} from 'ionicons/icons';
import './ProductsPage.css';
import { useHistory, useLocation } from "react-router-dom";
import { ProductService, RecommendDTO, Product } from '../../Services/ProductService';
import {SaveProductDTO } from '../../Services/ProfileService';
//import SwitchDark from "../../components/UIVerseSwitch/SwitchDark";
import { Settings as SettingsService } from '../../Services/SettingsService';
import {driver} from "driver.js"
import "driver.js/dist/driver.css";
import useAuthRedirect from "../../Services/useAuthRedirect";
import { menuController } from '@ionic/core';
import {ProfileService} from "../../Services/ProfileService";

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

interface FilterOptions {
    sortBy: 'points_asc' | 'points_desc' | 'date_desc' | 'none';
    minPoints: number;
    maxPoints: number;
}

const ProductsPage = () => {

    useAuthRedirect()

    const startProductsTour = () => {
        const driverObj = driver({
            showProgress: true,
            steps: [
                {
                    element: '.shopify-searchbar',
                    popover: {
                        title: '🔍 Barra de búsqueda',
                        description: 'Busca productos por nombre o descripción 🛍️',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '.filters-container',
                    popover: {
                        title: '🧰 Filtros por categoría',
                        description: 'Filtra los productos por categorías específicas 📂',
                        side: "bottom"
                    }
                },
                {
                    element: '.slider-container',
                    popover: {
                        title: '🔥 Ofertas destacadas',
                        description: 'Descubre nuestras ofertas y productos especiales 💥',
                        side: "bottom"
                    }
                },
                {
                    element: '.product-card',
                    popover: {
                        title: '🧾 Tarjeta de producto',
                        description: 'Haz clic para ver más detalles del producto. Usa las flechas para ver más imágenes 🖼️',
                        side: "left"
                    }
                },
                {
                    element: '.favorite-button',
                    popover: {
                        title: '❤️ Guardar favoritos',
                        description: 'Guarda los productos que te interesen en tu lista de favoritos ⭐',
                        side: "right"
                    }
                },
                {
                    element: '.rating-chip',
                    popover: {
                        title: '⭐ Puntuación del producto',
                        description: 'Muestra la puntuación del producto basada en las valoraciones de los usuarios 🗣️',
                        side: "right"
                    }
                },
                {
                    element: '.seller-chip',
                    popover: {
                        title: '🛒 Vendedor del producto',
                        description: 'Muestra el usuario que vende el producto 👤',
                        side: "right"
                    }
                }
            ],
            nextBtnText: '➡️ Siguiente',
            prevBtnText: '⬅️ Anterior',
            doneBtnText: '🎯 Siguiente tour',
            onDestroyed: async () => {
                try {
                    await menuController.enable(true);
                    const menu = document.querySelector('ion-menu') as HTMLIonMenuElement;
                    if (menu) {
                        await menu.open();
                        setTimeout(() => {
                            startMenuTour();
                        }, 300);
                    }
                } catch (error) {
                    console.error('❌ Error al abrir el menú:', error);
                }
            }
        });

        driverObj.drive();
    };

    const startMenuTour = () => {
        const menuTour = driver({
            showProgress: true,
            steps: [
                {
                    element: '.menu-header',
                    popover: {
                        title: '📋 Menú principal',
                        description: 'Accede a todas las funciones de la aplicación 🧭',
                        side: "right"
                    }
                },
                {
                    element: '.inicio',
                    popover: {
                        title: '🏠 Inicio',
                        description: 'Explora los diferentes productos 🛍️',
                        side: "right"
                    }
                },
                {
                    element: '.perfil',
                    popover: {
                        title: '👤 Perfil',
                        description: 'Visita tu perfil y mira los productos que tienes para intercambio y reseñas 🔄',
                        side: "right"
                    }
                },
                {
                    element: '.ia',
                    popover: {
                        title: '🤖 IA',
                        description: 'Accede a las funciones de inteligencia artificial, pregúntale y sube productos a través de este 🚀',
                        side: "right"
                    }
                },
                {
                    element: '.chat',
                    popover: {
                        title: '💬 Chats',
                        description: 'Chatea con otras personas para tradear 🗣️',
                        side: "right"
                    }
                },
                {
                    element: '.premium',
                    popover: {
                        title: '💎 Premium',
                        description: 'Accede a las funciones premium y suscripciones 🛡️',
                        side: "right"
                    }
                },
                {
                    element: '.ajustes',
                    popover: {
                        title: '⚙️ Ajustes',
                        description: 'Configura tu cuenta y preferencias de la aplicación 🧩',
                        side: "right"
                    }
                },
                {
                    element: '.cerrar_sesion',
                    popover: {
                        title: '🚪 Cerrar sesión',
                        description: 'Cierra tu sesión actual 🔐',
                        side: "right"
                    }
                }
            ],
            nextBtnText: '➡️ Siguiente',
            prevBtnText: '⬅️ Anterior',
            doneBtnText: '✅ Finalizar',
            onDestroyed: async () => {
                const menu = document.querySelector('ion-menu') as HTMLIonMenuElement;
                if (menu) {
                    await menu.close();
                }

                await ProfileService.setTutorialHecho();
            }
        });

        menuTour.drive();
    };

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
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

    const [showFilterPopover, setShowFilterPopover] = useState(false);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        sortBy: 'none',
        minPoints: 0,
        maxPoints: 1000
    });
    const [tempFilterOptions, setTempFilterOptions] = useState<FilterOptions>({
        sortBy: 'none',
        minPoints: 0,
        maxPoints: 1000
    });

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

    // Función para aplicar filtros a los productos
    const applyFiltersToProducts = (products: Product[]): Product[] => {
        let filtered = [...products];

        // Filtrar por rango de puntos
        if (filterOptions.minPoints > 0 || filterOptions.maxPoints < 1000) {
            filtered = filtered.filter(product => {
                const points = product.points || 0; // Manejar casos donde points pueda ser undefined
                return points >= filterOptions.minPoints && points <= filterOptions.maxPoints;
            });
        }

        // Ordenar productos
        switch (filterOptions.sortBy) {
            case 'points_asc':
                filtered.sort((a, b) => (a.points || 0) - (b.points || 0));
                break;
            case 'points_desc':
                filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
                break;
            case 'date_desc':
                filtered.sort((a, b) => {
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();
                    return dateB - dateA; // Más recientes primero
                });
                break;
            default:
                // No aplicar ordenamiento para 'none'
                break;
        }

        return filtered;
    };

    // Función para aplicar filtros
    const handleApplyFilters = () => {
        setFilterOptions(tempFilterOptions);
        setShowFilterPopover(false);

        // Aplicar filtros inmediatamente después de actualizar las opciones
        let productsToFilter: Product[] = [];

        if (searchText) {
            // Si hay texto de búsqueda, filtrar desde todos los productos
            productsToFilter = allProducts.filter(product =>
                product.name.toLowerCase().includes(searchText.toLowerCase())
            );
        } else if (selectedCategories.length > 0) {
            // Si hay categorías seleccionadas, obtener productos de esas categorías
            productsToFilter = getCategoryProducts();
        } else {
            // Si no hay filtros de categoría ni búsqueda, usar todos los productos
            productsToFilter = allProducts;
        }

        // Aplicar los filtros de ordenamiento y puntos
        const filtered = applyFiltersToProducts(productsToFilter);
        setFilteredProducts(filtered);
        setIsSearching(true); // Activar modo de búsqueda para mostrar los resultados filtrados
    };

    // Función para limpiar filtros
    const handleClearFilters = () => {
        const defaultFilters: FilterOptions = {
            sortBy: 'none',
            minPoints: 0,
            maxPoints: 1000
        };
        setTempFilterOptions(defaultFilters);
        setFilterOptions(defaultFilters);
        setShowFilterPopover(false);

        // Recargar productos sin filtros adicionales
        if (searchText) {
            // Si hay búsqueda activa, recargar resultados de búsqueda sin filtros
            const searchResults = allProducts.filter(product =>
                product.name.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredProducts(searchResults);
        } else if (selectedCategories.length > 0) {
            // Si hay categorías seleccionadas, recargar esas categorías sin filtros adicionales
            const categoryProducts = getCategoryProducts();
            setFilteredProducts(categoryProducts);
        } else {
            // Si no hay filtros activos, salir del modo de búsqueda
            setFilteredProducts([]);
            setIsSearching(false);
        }
    };

    // Función auxiliar para obtener productos de categorías seleccionadas
    const getCategoryProducts = (): Product[] => {
        let filtered: Product[] = [];
        if (recommendedData && recommendedData.titles && recommendedData.products) {
            recommendedData.titles.forEach((title, index) => {
                if (selectedCategories.includes(title) && recommendedData.products[index]) {
                    filtered = [...filtered, ...recommendedData.products[index]];
                }
            });
        }
        return filtered;
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

            // Update UI immediately for better UX (optimistic update)
            const isCurrentlyFavorite = favorites[productId];
            setFavorites(prev => ({
                ...prev,
                [productId]: !isCurrentlyFavorite
            }));

            let response;

            if (isCurrentlyFavorite) {
                // If already favorited, remove from favorites
                response = await ProfileService.deleteProductFromProfile(saveProductDTO);

                if (response.success) {
                    // Show success message immediately
                    showToastMessage('Producto eliminado de favoritos', 'success');

                    // Force refresh of saved products cache to ensure consistency
                    ProfileService.refreshSavedProductsCache();

                    // If we're on profile page, trigger a refresh of saved products
                    if (window.location.pathname.includes('/profile')) {
                        window.dispatchEvent(new CustomEvent('favoritesUpdated', {
                            detail: { action: 'removed', productId }
                        }));
                    }
                } else {
                    // Revert optimistic update on failure
                    setFavorites(prev => ({
                        ...prev,
                        [productId]: true
                    }));
                    showToastMessage(response.message || 'Error al eliminar de favoritos', 'danger');
                }
            } else {
                // If not favorite, add to favorites
                response = await ProfileService.saveProductToProfile(saveProductDTO);

                if (response.success) {
                    // Show success message immediately
                    showToastMessage('Producto guardado en favoritos', 'success');

                    // Force refresh of saved products cache to ensure consistency
                    ProfileService.refreshSavedProductsCache();

                    // If we're on profile page, trigger a refresh of saved products
                    if (window.location.pathname.includes('/profile')) {
                        window.dispatchEvent(new CustomEvent('favoritesUpdated', {
                            detail: { action: 'added', productId }
                        }));
                    }
                } else {
                    // Revert optimistic update on failure
                    setFavorites(prev => ({
                        ...prev,
                        [productId]: false
                    }));
                    showToastMessage(response.message || 'Error al guardar en favoritos', 'danger');
                }
            }

        } catch (error) {
            console.error('Error managing favorite:', error);

            // Revert optimistic update on error
            setFavorites(prev => ({
                ...prev,
                [productId]: !prev[productId] // Revert to previous state
            }));

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

    // Load user profile and saved products
    // Modifica el primer useEffect donde se carga el perfil
    useEffect(() => {
        const loadUserProfile = async () => {
            const modo = await SettingsService.getModoOcuro()
            sessionStorage.setItem('modoOscuroClaro', modo.toString());

            // Obtener el valor del modo oscuro del sessionStorage
            const modoOscuroStorage = sessionStorage.getItem('modoOscuroClaro');

            if (modoOscuroStorage === null) {
                try {
                    const modoOscuroBackend = await SettingsService.getModoOcuro();
                    const modoOscuroFinal = modoOscuroBackend === true;
                    sessionStorage.setItem('modoOscuroClaro', modoOscuroFinal.toString());
                    setDarkMode(modoOscuroFinal);
                } catch (error) {
                    console.error('Error al obtener modo oscuro del backend:', error);
                    sessionStorage.setItem('modoOscuroClaro', 'false');
                    setDarkMode(false);
                }
            } else {
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
        if (isSearching) {
            const productsToFilter = searchText ?
                allProducts.filter(product =>
                    product.name.toLowerCase().includes(searchText.toLowerCase())
                ) :
                selectedCategories.length > 0 ? getCategoryProducts() : filteredProducts;

            const filtered = applyFiltersToProducts(productsToFilter);
            setFilteredProducts(filtered);
        }
    }, [filterOptions]);

    // Load recommended data from backend
    useEffect(() => {
        const fetchRecommendedProducts = async () => {
            try {
                setLoading(true);
                const data = await ProductService.getRecommendedProducts();

                setRecommendedData(data);

                if (data && data.products) {
                    const combinedProducts = data.products.flat();
                    setAllProducts(combinedProducts);

                    const initialImageIndexes: ImageIndexes = {};
                    combinedProducts.forEach(product => {
                        initialImageIndexes[product.id] = 0;
                    });
                    setCurrentImages(initialImageIndexes);
                }

                if (data && data.titles) {
                    setAvailableCategories(data.titles);
                }

                if (sessionStorage.getItem("token")) {
                    const [profileData, tutorialHecho] = await Promise.all([
                        ProfileService.getProfileInfo(),
                        ProfileService.getTutorialHecho()
                    ]);

                    setProfileId(profileData.id);

                    // Carga productos guardados
                    const savedProducts = await ProfileService.getSavedProducts();
                    const favoritesMap: Favorites = {};
                    savedProducts.forEach(product => {
                        favoritesMap[product.id] = true;
                    });
                    setFavorites(favoritesMap);

                    // Pequeño retraso para asegurar que todos los elementos estén renderizados
                }

                setLoading(false);
                setIsInitialLoadComplete(true);
            } catch (err) {
                console.error('Error loading recommended products:', err);
                setError('Could not load recommended products');
                setLoading(false);
                showToastMessage('No se pudieron cargar los productos recomendados');
            }
        };

        fetchRecommendedProducts();
    }, []);

    useEffect(() => {
        const checkTutorial = async () => {
            if (isInitialLoadComplete && sessionStorage.getItem("token")) {
                try {
                    const tutorialHecho = await ProfileService.getTutorialHecho();
                    if (!tutorialHecho) {
                        startProductsTour();
                    }
                } catch (error) {
                    console.error('Error al verificar el tutorial:', error);
                }
            }
        };

        checkTutorial();
    }, [isInitialLoadComplete]);

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

        let filtered = allProducts.filter(product =>
            product.name.toLowerCase().includes(normalizedQuery)
        );

        // Aplicar filtros activos a los resultados de búsqueda
        filtered = applyFiltersToProducts(filtered);

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
            title: 'Descuentos Flash - 24h',
            description: 'Aprovecha ofertas especiales con hasta 70% de descuento solo por hoy',
            buttonText: 'Ver ofertas',
            backgroundColor: darkMode ? 'linear-gradient(135deg, #1a3a63, #0f2541)' : 'linear-gradient(135deg, #e4edff, #d1e2ff)',
            textColor: darkMode ? '#5c8fee' : '#4a80e4',
            buttonColor: darkMode ? '#6495fa' : '#4a80e4'
        },
        {
            id: 2,
            title: 'Categorías destacadas',
            description: 'Explora nuestras colecciones más populares del momento',
            buttonText: 'Explorar',
            backgroundColor: darkMode ? 'linear-gradient(135deg, #1e1a3a, #2a1a45)' : 'linear-gradient(135deg, #eee6ff, #dfd6ff)',
            textColor: darkMode ? '#a48aff' : '#7e5cff',
            buttonColor: darkMode ? '#a48aff' : '#7e5cff'
        },
        {
            id: 3,
            title: 'Vende rápido con Premium',
            description: 'Destaca tu producto por solo 9.99€/mes y véndelo hasta 5 veces más rápido',
            buttonText: 'Promocionar',
            backgroundColor: darkMode ? 'linear-gradient(135deg, #3a1a2a, #45152a)' : 'linear-gradient(135deg, #ffe4ee, #ffd6e6)',
            textColor: darkMode ? '#ff8ab2' : '#e64a8a',
            buttonColor: darkMode ? '#ff8ab2' : '#e64a8a'
        }
    ];

    const handleSliderButtonClick = (slideId: number) => {
        switch (slideId) {
            case 1: // Descuentos Flash
                // Filtrar productos con descuento
                setSelectedCategories(['Ofertas', 'Descuentos']);
                break;
            case 2: // Categorías destacadas
                // Mostrar categorías populares o destacadas
                if (availableCategories.length > 0) {
                    // Tomar las 3 primeras categorías como ejemplo de destacadas
                    const featuredCategories = availableCategories.slice(0, 3);
                    setSelectedCategories(featuredCategories);
                }
                break;
            case 3: // Vende rápido con Premium
                // Redirigir a la página de crear anuncio con opción premium preseleccionada
                history.push('/premiumSuscribe');
                break;
            default:
                break;
        }
    };

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
        // Si no hay categorías seleccionadas, también resetear los filtros
        if (selectedCategories.length === 0) {
            const defaultFilters: FilterOptions = {
                sortBy: 'none',
                minPoints: 0,
                maxPoints: 1000
            };
            setFilterOptions(defaultFilters);
            setTempFilterOptions(defaultFilters);
        }
    };

    const clearCategoryFilters = () => {
        setSelectedCategories([]);
        // Si no hay búsqueda activa, también resetear los filtros
        if (!searchText) {
            const defaultFilters: FilterOptions = {
                sortBy: 'none',
                minPoints: 0,
                maxPoints: 1000
            };
            setFilterOptions(defaultFilters);
            setTempFilterOptions(defaultFilters);
            setIsSearching(false);
            setFilteredProducts([]);
        }
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

    useEffect(() => {
        if (isSearching) {
            let productsToFilter: Product[] = [];

            if (searchText) {
                // Si hay texto de búsqueda, filtrar desde todos los productos
                productsToFilter = allProducts.filter(product =>
                    product.name.toLowerCase().includes(searchText.toLowerCase())
                );
            } else if (selectedCategories.length > 0) {
                // Si hay categorías seleccionadas, obtener productos de esas categorías
                productsToFilter = getCategoryProducts();
            } else {
                // Si no hay filtros de categoría ni búsqueda, usar productos filtrados existentes
                productsToFilter = filteredProducts;
            }

            // Aplicar los filtros de ordenamiento y puntos
            const filtered = applyFiltersToProducts(productsToFilter);
            setFilteredProducts(filtered);
        }
    }, [filterOptions, searchText, selectedCategories, allProducts, recommendedData]);

    // Filter products by selected categories
    useEffect(() => {
        if (selectedCategories.length === 0) {
            // Si no hay categorías seleccionadas y no hay búsqueda, salir del modo filtrado
            if (!searchText) {
                setIsSearching(false);
                setFilteredProducts([]);
            }
            return;
        }

        setIsSearching(true);

        // Obtener productos de las categorías seleccionadas
        let filtered = getCategoryProducts();

        // Aplicar filtros activos
        filtered = applyFiltersToProducts(filtered);

        setFilteredProducts(filtered);
    }, [selectedCategories, recommendedData, filterOptions]);

    // Function to format points
    const formatPoints = (points: number): string => {
        if (points < 0) return "No evaluado";
        return `${points} puntos`;
    };

    // Function to truncate and format description
    const truncateDescription = (description: string | undefined, maxLength: number = 65): string => {
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
        if (premium === 'PREMIUM') {
            return (
                <IonBadge color="warning" className="premium-badge">
                    <IonIcon icon={star} /> Premium
                </IonBadge>
            );
        }
        return null;
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
                    // Solo navegar a detalle si no está clickeando en botones de navegación o favorito
                    if (!(e.target as Element).closest('.image-nav-button') &&
                        !(e.target as Element).closest('.favorite-button')) {
                        console.log('Product selected:', product);
                        history.push(`/product/${product.id}/${product.profile.id}`);
                    }
                }}
            >
                <div className="product-image-container"
                     onClick={(e: React.MouseEvent) => {
                         // Prevenir que el click en la imagen ejecute la navegación de imagen
                         // Solo permitir que pase al contenedor padre para ir al detalle del producto
                         if (!(e.target as Element).closest('.image-nav-button') &&
                             !(e.target as Element).closest('.favorite-button')) {
                             // No hacer nada aquí, dejar que el evento burbujee al contenedor padre
                             return;
                         }
                         handleProductImageClick(product.id, product.imagenes?.length || 0, e);
                     }}>
                    <div className="product-image">
                        {product.imagenes && product.imagenes.length > 0 ? (
                            <img
                                src={product.imagenes[currentImageIndex] || ''}
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
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevenir que el click vaya al contenedor padre
                                        navigateProductImage(product.id, 'prev', product.imagenes?.length || 0, e);
                                    }}
                                    aria-label="Previous image"
                                >
                                    <IonIcon icon={arrowBack}/>
                                </button>
                                <button
                                    className="image-nav-button image-nav-next"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevenir que el click vaya al contenedor padre
                                        navigateProductImage(product.id, 'next', product.imagenes?.length || 0, e);
                                    }}
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
                            onClick={(e) => {
                                e.stopPropagation(); // Prevenir que el click vaya al contenedor padre
                                handleToggleFavorite(product.id, product.profile.id, e);
                            }}
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

                    {/* Descripción ahora es más corta y va antes del rating */}
                    <p className="product-description">{truncateDescription(product.description, 65)}</p>

                    {/* Rating ahora es un IonChip */}
                    <IonChip className="rating-chip" color="primary">
                        <span className="product-points">{formatPoints(product.points)}</span>
                    </IonChip>

                    <div className="product-meta">
                        <div className="seller-info">
                            {product.profile && (
                                <>
                                    <IonChip className="seller-chip custom-chip" outline={true}>
                                        <span className="seller-name">{product.profile.nickname}</span>
                                        {product.profile.newUser && <span className="new-user-badge">New</span>}
                                    </IonChip>
                                    <IonChip className="date-chip custom-chip" outline={true}>
                                        <span>{formatDate(product.createdAt)}</span>
                                    </IonChip>
                                </>
                            )}
                        </div>
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
                                <IonMenuButton>
                                    <IonIcon
                                        icon={menuOutline}
                                        style={{
                                            color: darkMode ? 'white' : 'black',
                                            fontSize: '24px'
                                        }}
                                    />
                                </IonMenuButton>
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

                            <div className="header-icons">
                                <IonIcon
                                    onClick={startProductsTour}
                                    icon={informationCircleOutline}
                                    className="header-icon"
                                />
                                {/* Solo mostrar el filtro si estamos buscando o hay categorías seleccionadas */}
                                {(isSearching || selectedCategories.length > 0) && (
                                    <IonIcon
                                        onClick={() => setShowFilterPopover(!showFilterPopover)}
                                        icon={funnelOutline}
                                        className={`header-icon filter-icon ${(filterOptions.sortBy !== 'none' || filterOptions.minPoints > 0 || filterOptions.maxPoints < 1000) ? 'active' : ''}`}
                                    />
                                )}
                            </div>
                        </div>
                    </IonToolbar>

                    {/* Popover de filtros */}
                    {showFilterPopover && (
                        <div className="filter-popover">
                            <div className="filter-header">
                                <h3>Filtros</h3>
                                <IonIcon
                                    icon={closeOutline}
                                    onClick={() => setShowFilterPopover(false)}
                                    className="close-icon"
                                />
                            </div>

                            <div className="filter-content">
                                {/* Ordenar por */}
                                <div className="filter-section">
                                    <h4>Ordenar por</h4>
                                    <div className="filter-options">
                                        <label className="filter-option">
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                value="none"
                                                checked={tempFilterOptions.sortBy === 'none'}
                                                onChange={(e) => setTempFilterOptions({...tempFilterOptions, sortBy: e.target.value as any})}
                                            />
                                            <span>Sin ordenar</span>
                                        </label>
                                        <label className="filter-option">
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                value="points_desc"
                                                checked={tempFilterOptions.sortBy === 'points_desc'}
                                                onChange={(e) => setTempFilterOptions({...tempFilterOptions, sortBy: e.target.value as any})}
                                            />
                                            <span>Más puntos primero</span>
                                        </label>
                                        <label className="filter-option">
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                value="points_asc"
                                                checked={tempFilterOptions.sortBy === 'points_asc'}
                                                onChange={(e) => setTempFilterOptions({...tempFilterOptions, sortBy: e.target.value as any})}
                                            />
                                            <span>Menos puntos primero</span>
                                        </label>
                                        <label className="filter-option">
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                value="date_desc"
                                                checked={tempFilterOptions.sortBy === 'date_desc'}
                                                onChange={(e) => setTempFilterOptions({...tempFilterOptions, sortBy: e.target.value as any})}
                                            />
                                            <span>Más recientes</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Rango de puntos */}
                                <div className="filter-section">
                                    <h4>Rango de puntos</h4>
                                    <div className="range-inputs">
                                        <div className="range-input">
                                            <label>Mínimo:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="1000"
                                                value={tempFilterOptions.minPoints}
                                                onChange={(e) => setTempFilterOptions({...tempFilterOptions, minPoints: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div className="range-input">
                                            <label>Máximo:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="1000"
                                                value={tempFilterOptions.maxPoints}
                                                onChange={(e) => setTempFilterOptions({...tempFilterOptions, maxPoints: parseInt(e.target.value) || 1000})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="filter-actions">
                                <IonButton
                                    fill="clear"
                                    size="small"
                                    onClick={handleClearFilters}
                                >
                                    Limpiar
                                </IonButton>
                                <IonButton
                                    size="small"
                                    onClick={handleApplyFilters}
                                >
                                    Aplicar filtros
                                </IonButton>
                            </div>
                        </div>
                    )}
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
                            <h2>Resultados para "{searchText}"</h2>
                        <IonButton fill="clear" onClick={clearSearch}>
                            Atrás
                        </IonButton>
                    </div>
                )}

                    {isSearching && selectedCategories.length > 0 && !searchText && (
                        <div className="search-results-header">
                            <h2>Filtered by categories: {selectedCategories.join(', ')}</h2>
                            <IonButton fill="clear" onClick={clearCategoryFilters}>
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
                                    className={`slider-item slide-${item.id}`}
                                    style={{backgroundColor: item.backgroundColor}}
                                >
                                    <div className="slider-content">
                                        <div className="slider-text" style={{color: item.textColor}}>
                                            <h2 className="slider-title">{item.title}</h2>
                                            <p className="slider-description">{item.description}</p>
                                            <button
                                                className="slider-button"
                                                style={{backgroundColor: item.buttonColor}}
                                                onClick={() => handleSliderButtonClick(item.id)}
                                            >
                                                <IonIcon icon={add} className="button-icon"/>
                                                {item.buttonText}
                                            </button>
                                        </div>
                                        <div className="slider-image">
                                            {/* Aquí podrías agregar imágenes relevantes para cada slide */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                    </>
                    )}

                    {/* Filter chips - Show always to allow filtering */}
                    <div className="filters-container-wrapper">
                        <button
                            className="filters-nav-button filters-nav-prev"
                            onClick={() => {
                                if (document.querySelector('.filters-container')) {
                                    const container = document.querySelector('.filters-container') as HTMLElement;
                                    container.scrollBy({left: -200, behavior: 'smooth'});
                                }
                            }}
                            aria-label="Scroll left"
                        >
                            <IonIcon icon={arrowBack}/>
                        </button>

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

                        <button
                            className="filters-nav-button filters-nav-next"
                            onClick={() => {
                                if (document.querySelector('.filters-container')) {
                                    const container = document.querySelector('.filters-container') as HTMLElement;
                                    container.scrollBy({ left: 200, behavior: 'smooth' });
                                }
                            }}
                            aria-label="Scroll right"
                        >
                            <IonIcon icon={arrowForward} />
                        </button>
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
                            clearCategoryFilters();
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
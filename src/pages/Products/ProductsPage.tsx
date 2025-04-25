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
    IonButton
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
import {useHistory, useLocation} from "react-router-dom";



interface CustomLocationState {
  token?: string;
}
const ProductsPage = () => {
    const history = useHistory();
    const location = useLocation<CustomLocationState>();

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

    const [searchText, setSearchText] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('Hogar');
    const [isDesktop, setIsDesktop] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const sliderRef = useRef<HTMLDivElement | null>(null);

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
            setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
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

    // Categorías de productos
    const categories = [
        {
            title: "Lo que necesitas para tu jardín",
            items: [
                { id: 1, name: 'Sofá de jardín', points: '5.200 anuncios', image: 'sofa.jpg' },
                { id: 2, name: 'Mesa de jardín', points: '29.177 anuncios', image: 'mesa.jpg' },
                { id: 3, name: 'Sillón de jardín', points: '5.104 anuncios', image: 'sillon.jpg' },
                { id: 4, name: 'Conjunto de jardín', points: '4.586 anuncios', image: 'conjunto.jpg' },
                { id: 5, name: 'Pérgola', points: '1.711 anuncios', image: 'pergola.jpg' },
                { id: 6, name: 'Sofá de jardín', points: '5.200 anuncios', image: 'sofa.jpg' },
                { id: 7, name: 'Mesa de jardín', points: '29.177 anuncios', image: 'mesa.jpg' },
                { id: 8, name: 'Sillón de jardín', points: '5.104 anuncios', image: 'sillon.jpg' },
                { id: 9, name: 'Conjunto de jardín', points: '4.586 anuncios', image: 'conjunto.jpg' },
                { id: 10, name: 'Pérgola', points: '1.711 anuncios', image: 'pergola.jpg' }
            ]
        },
        {
            title: "¡Bienvenida temporada de Barbacoas!",
            items: [
                { id: 6, name: 'Barbacoa Eléctrica', points: '4.235 anuncios', image: 'bbq_electrica.jpg' },
                { id: 7, name: 'Barbacoa de carbón', points: '1.444 anuncios', image: 'bbq_carbon.jpg' },
                { id: 8, name: 'Barbacoa sin humo', points: '274 anuncios', image: 'bbq_sinhumo.jpg' },
                { id: 9, name: 'Barbacoa de gas', points: '4.676 anuncios', image: 'bbq_gas.jpg' },
                { id: 10, name: 'Barbacoa de obra', points: '3.048 anuncios', image: 'bbq_obra.jpg' }
            ]
        },
        {
            title: "Renueva tu rutina",
            items: [
                { id: 11, name: 'Cinta de correr', points: '2.354 anuncios', image: 'cinta.jpg' },
                { id: 12, name: 'Bicicleta estática', points: '3.750 anuncios', image: 'bici.jpg' },
                { id: 13, name: 'Elíptica', points: '1.829 anuncios', image: 'eliptica.jpg' },
                { id: 14, name: 'Pesas', points: '6.235 anuncios', image: 'pesas.jpg' },
                { id: 15, name: 'Accesorios fitness', points: '8.120 anuncios', image: 'accesorios.jpg' }
            ]
        }
    ];

    // Filtros disponibles
    const filters = ['Hogar', 'Tecnología', 'Deporte', 'Jardín', 'Muebles'];

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

                {/* Secciones de categorías */}
                {categories.map((category, index) => (
                    <div key={index} className="category-section">
                        <div className="category-header">
                            <h2 className="section-title">{category.title}</h2>
                            <IonButton fill="clear" className="view-all-button">
                                Ver todo <IonIcon icon={chevronForward} />
                            </IonButton>
                        </div>

                        {/* Contenedor horizontal con scroll */}
                        <div className="items-scroll-container">
                            {category.items.map((item) => (
                                <div key={item.id} className="product-card">
                                    <div className="product-image">
                                        {/* Placeholder for real images */}
                                        <div className="favorite-button">
                                            <IonIcon icon={heart} />
                                        </div>
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">{item.name}</h3>
                                        <p className="product-points">{item.points}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </IonContent>
            <Navegation isDesktop={isDesktop} />
        </IonPage>
    );
};

export default ProductsPage;
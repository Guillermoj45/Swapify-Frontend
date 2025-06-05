import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
    IonMenu,
    IonHeader,
    IonToolbar,
    IonLabel,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonFooter,
    IonTabBar,
    IonTabButton,
} from '@ionic/react';
import {
    homeOutline,
    addOutline,
    mailOutline,
    personCircle,
    logOut,
    settings,
    shieldCheckmark,
    notificationsCircleOutline,
} from 'ionicons/icons';
import './Navegation.css';

const Navegacion: React.FC<{isDesktop: boolean, isChatView?: boolean}> = ({ isDesktop, isChatView = false }) => {
    const history = useHistory();
    const location = useLocation();

    // Estado para el modo oscuro/claro - sincronizado con Settings
    const [darkMode, setDarkMode] = useState<boolean>(false);
    // Estado adicional para forzar re-renderización
    const [themeKey, setThemeKey] = useState<number>(0);

    // Solo mostramos el menú hamburguesa en desktop
    // En mobile siempre usamos el footer/tabbar
    const showHamburgerMenu = isDesktop;
    const showTabBar = !isDesktop;

    // Función para aplicar el tema - similar a Settings
    const applyTheme = useCallback((isDark: boolean): void => {
        const body = document.body;
        const root = document.documentElement;

        // Remover clases existentes
        body.classList.remove("dark-theme", "light-theme", "dark-mode", "light-mode");

        // Aplicar nuevas clases
        body.classList.add(isDark ? "dark-theme" : "light-theme");
        body.classList.add(isDark ? "dark-mode" : "light-mode");

        // Establecer atributo en root para CSS variables
        root.setAttribute("data-theme", isDark ? "dark" : "light");

        // Guardar en sessionStorage para mantener consistencia con Settings
        sessionStorage.setItem("modoOscuroClaro", isDark.toString());

        // También mantener localStorage para compatibilidad hacia atrás
        localStorage.setItem('darkMode', JSON.stringify(isDark));

        // Forzar re-renderización del componente
        setThemeKey(prev => prev + 1);
    }, []);

    // Inicializar tema al cargar el componente
    useEffect(() => {
        const initializeTheme = () => {
            // Priorizar sessionStorage (usado por Settings) sobre localStorage
            const sessionSaved = sessionStorage.getItem("modoOscuroClaro");
            const localSaved = localStorage.getItem('darkMode');

            let initialDarkMode = false;

            if (sessionSaved !== null) {
                initialDarkMode = sessionSaved === "true";
            } else if (localSaved !== null) {
                initialDarkMode = JSON.parse(localSaved);
            }

            setDarkMode(initialDarkMode);
            applyTheme(initialDarkMode);
        };

        initializeTheme();
    }, [applyTheme]);

    // Escuchar cambios en sessionStorage para sincronizar con Settings
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "modoOscuroClaro" && e.newValue !== null) {
                const newDarkMode = e.newValue === "true";
                setDarkMode(newDarkMode);
                applyTheme(newDarkMode);
            }
        };

        // También escuchar eventos personalizados para cambios en tiempo real
        const handleThemeChange = (e: CustomEvent) => {
            const newDarkMode = e.detail.darkMode;
            setDarkMode(newDarkMode);
            applyTheme(newDarkMode);
        };

        // Función para detectar cambios en tiempo real usando MutationObserver
        const observeThemeChanges = () => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' &&
                        (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {

                        const body = document.body;
                        const isDark = body.classList.contains('dark-mode') || body.classList.contains('dark-theme');
                        const currentTheme = sessionStorage.getItem("modoOscuroClaro");

                        if (currentTheme !== null) {
                            const storedDarkMode = currentTheme === "true";
                            if (storedDarkMode !== darkMode) {
                                setDarkMode(storedDarkMode);
                                setThemeKey(prev => prev + 1);
                            }
                        }
                    }
                });
            });

            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class', 'data-theme']
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme']
            });

            return observer;
        };

        // Polling para detectar cambios de tema cada 500ms
        const themePolling = setInterval(() => {
            const currentTheme = sessionStorage.getItem("modoOscuroClaro");
            if (currentTheme !== null) {
                const storedDarkMode = currentTheme === "true";
                if (storedDarkMode !== darkMode) {
                    setDarkMode(storedDarkMode);
                    setThemeKey(prev => prev + 1);
                }
            }
        }, 500);

        const observer = observeThemeChanges();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('themeChange' as any, handleThemeChange);

        return () => {
            clearInterval(themePolling);
            observer.disconnect();
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('themeChange' as any, handleThemeChange);
        };
    }, [applyTheme, darkMode]);

    // Función para manejar la navegación con un enfoque más directo
    const navigateTo = (path: string) => {
        if (path === '/chat') {
            history.replace(path);
            setTimeout(() => {
                history.go(0);
            }, 10);
        } else {
            history.push(path);
        }
    };

    // Verificar si una ruta está activa
    const isActive = (path: string) => {
        return location.pathname.toLowerCase() === path.toLowerCase();
    };

    // Función para limpiar sesión (similar a Settings)
    const handleLogout = () => {
        // Limpiar tokens y datos de sesión
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");

        // Navegar a login
        navigateTo('/login');
    };

    return (
        <div
            key={`navigation-${themeKey}-${darkMode}`}
            className={`navegacion-container ${darkMode ? 'dark-mode' : 'light-mode'} ${darkMode ? 'dark-theme' : 'light-theme'}`}
            data-theme={darkMode ? 'dark' : 'light'}
        >
            {/* Menú hamburguesa */}
            {showHamburgerMenu && (
                <IonMenu
                    contentId="main-content"
                    side="start"
                    key={`menu-${themeKey}-${darkMode}`}
                >
                    <IonHeader>
                        <IonToolbar>
                            <div className="menu-header">
                                <div className="menu-title">
                                    <span className="menu-logo">Swapify</span>
                                    <img src={"public/Swapify.png"} alt="Swapify" style={{ width: '40px', height: '40px' }}/>
                                </div>
                            </div>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <IonList className="menu-list">
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item inicio ${isActive('/products') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/products')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={homeOutline} />
                                    <IonLabel>Inicio</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item perfil ${isActive('/profile') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/profile')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={personCircle} />
                                    <IonLabel>Perfil</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item ia ${isActive('/IA') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/IA')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={addOutline} />
                                    <IonLabel>IA</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item chat ${isActive('/chat') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/chat')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={mailOutline} />
                                    <IonLabel>Chats</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item notification ${isActive('/notification') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/notification')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={notificationsCircleOutline} />
                                    <IonLabel>Notificaciones</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item premium ${isActive('/premiumSuscribe') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/premiumSuscribe')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={shieldCheckmark} />
                                    <IonLabel>Premium</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item ajustes ${isActive('/settings') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/settings')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={settings} />
                                    <IonLabel>Ajustes</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <div className="menu-divider"></div>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className="menu-item cerrar_sesion logout"
                                    button
                                    onClick={handleLogout}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={logOut} />
                                    <IonLabel>Cerrar sesión</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                        </IonList>
                    </IonContent>
                </IonMenu>
            )}

            {/* TabBar for mobile devices */}
            {showTabBar && (
                <IonFooter
                    className="ion-no-border navigation-footer"
                    key={`footer-${themeKey}-${darkMode}`}
                >
                    <IonTabBar slot="bottom" className="custom-tab-bar">
                        <IonTabButton
                            tab="products"
                            onClick={() => navigateTo('/products')}
                            className={`custom-tab-button ${isActive('/products') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={homeOutline} />
                            <IonLabel>Inicio</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="profile"
                            onClick={() => navigateTo('/profile')}
                            className={`custom-tab-button ${isActive('/profile') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={personCircle} />
                            <IonLabel>Perfil</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="ia"
                            onClick={() => navigateTo('/IA')}
                            className={`custom-tab-button ${isActive('/IA') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={addOutline} />
                            <IonLabel>IA</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="chat"
                            onClick={() => navigateTo('/chat')}
                            className={`custom-tab-button ${isActive('/chat') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={mailOutline} />
                            <IonLabel>Chats</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="notification"
                            onClick={() => navigateTo('/notification')}
                            className={`custom-tab-button ${isActive('/notification') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={notificationsCircleOutline} />
                            <IonLabel>Notifs</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="premium"
                            onClick={() => navigateTo('/premiumSuscribe')}
                            className={`custom-tab-button ${isActive('/premiumSuscribe') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={shieldCheckmark} />
                            <IonLabel>Premium</IonLabel>
                        </IonTabButton>
                    </IonTabBar>
                </IonFooter>
            )}
        </div>
    );
};

export default Navegacion;
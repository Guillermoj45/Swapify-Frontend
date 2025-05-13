"use client";

import { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";

import {
    IonAvatar,
    IonBadge,
    IonButton,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonLoading,
    IonMenuButton,
    IonPage,
    IonRow,
    IonSegment,
    IonSegmentButton,
    IonThumbnail,
    IonToolbar
} from "@ionic/react";

import {
    bookmarkOutline,
    cartOutline,
    chatbubbleOutline,
    heartOutline,
    star,
    starOutline
} from "ionicons/icons";

import { Building, MapPin } from "lucide-react";

import ProfileService, { ProfileDTO, ProductDTO } from "../../Services/ProfileService";
import "./ProfilePage.css";

export default function ProfilePage() {
    const history = useHistory();

    // State
    const [loading, setLoading] = useState(true);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [profileData, setProfileData] = useState<ProfileDTO | null>(null);
    const [userProducts, setUserProducts] = useState<ProductDTO[]>([]);
    const [savedProducts, setSavedProducts] = useState<ProductDTO[]>([]);
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [showAllSavedProducts, setShowAllSavedProducts] = useState(false);
    const [activeTab, setActiveTab] = useState("reseñas");
    const [bannerImage, setBannerImage] = useState<string>("");

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
        biography: ""
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effects
    useEffect(() => {
        const checkAuth = async () => {
            if (!sessionStorage.getItem("token")) {
                history.push("/login");
                return;
            }

            try {
                setLoading(true);
                const profileInfo = await ProfileService.getProfileInfo();
                setProfileData(profileInfo);
                setBannerImage(profileInfo.banner)

                const products = await ProfileService.getUserProducts();
                setUserProducts(products);

                setUserInfo(prev => ({
                    ...prev,
                    name: profileInfo.nickname || "Usuario",
                    itemsForSale: products.length
                }));

                setShowAllProducts(false);
            } catch (error) {
                console.error("Error loading profile or products:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [history]);

    useEffect(() => {
        if (activeTab === "deseados") {
            const loadSaved = async () => {
                setLoadingSaved(true);
                try {
                    const saved = await ProfileService.getSavedProducts();
                    setSavedProducts(saved);
                    setShowAllSavedProducts(false);
                } catch (error) {
                    console.error("Error loading saved products:", error);
                } finally {
                    setLoadingSaved(false);
                }
            };

            loadSaved();
        }
    }, [activeTab]);

    useEffect(() => {
        const isDark = sessionStorage.getItem('modoOscuroClaro') === 'true';
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.body.style.setProperty('--ion-background-color', isDark ? '#0a0a0a' : '#ffffff');
        document.body.style.setProperty('--ion-text-color', isDark ? '#ffffff' : '#333333');
    }, []);

    useEffect(() => {
        applyTheme();

        // Agregar un observador para cambios en sessionStorage
        const handleStorageChange = () => {
            applyTheme();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const applyTheme = () => {
        const isDark = sessionStorage.getItem('modoOscuroClaro') === 'true';
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.style.setProperty('--ion-background-color', '#0a0a0a');
            document.body.style.setProperty('--ion-text-color', '#ffffff');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.style.setProperty('--ion-background-color', '#ffffff');
            document.body.style.setProperty('--ion-text-color', '#333333');
        }
    };

    // Handlers
    const handleBannerClick = () => fileInputRef.current?.click();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Mostrar preview local
            const reader = new FileReader();
            reader.onloadend = () => setBannerImage(reader.result as string);
            reader.readAsDataURL(file);

            // Subir a servidor
            const result = await ProfileService.updateBanner(file);

            if(result.success) {
                setBannerImage(result.imageUrl);
            }

        } catch (error) {
            console.error('Error al subir la imagen:', error);
            // Aquí podrías mostrar un mensaje de error al usuario
        }
    };

    // Helpers
    const formatPoints = (points: number) => `${points} pts`;
    const getProductImage = (images: string[]) => images[0] || "/placeholder.svg?height=60&width=60";
    const renderStars = (rating: number) =>
        Array.from({ length: 5 }, (_, i) => (
            <IonIcon
                key={i}
                icon={i < rating ? star : starOutline}
                className={i < rating ? "star-filled" : "star-outline"}
            />
        ));

    // Static reviews sample
    const reviews = [
        { id: 1, product: "Samsung DS2 5G", comment: "Todo perfecto", reviewer: "rafa", rating: 5, date: "26 Aug 2024", image: "/placeholder.svg?height=40&width=40" },
        { id: 2, product: "Apple AirPods", comment: "Excelente servicio", reviewer: "maria", rating: 4, date: "15 Sep 2024", image: "/placeholder.svg?height=40&width=40" }
    ];

    // Tab content renderer
    const renderTabContent = () => {
        if (activeTab === "enVenta") {
            const items = showAllProducts ? userProducts : userProducts.slice(0, 3);

            return (
                <div className="tab-content">
                    <h3 className="tab-title">Artículos en venta ({userInfo.itemsForSale})</h3>
                    <IonList lines="none" style={{ backgroundColor: "white" }}>
                        {loading ? (
                            <div className="loading-message">Cargando productos...</div>
                        ) : items.length === 0 ? (
                            <div className="empty-message">No tienes productos en venta</div>
                        ) : (
                            items.map(product => (
                                <IonItem key={product.id} className="item-card">
                                    <IonThumbnail slot="start">
                                        <img src={getProductImage(product.imagenes)} alt={product.name} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg?height=60&width=60"; }} />
                                    </IonThumbnail>
                                    <div className="item-details">
                                        <h4>{product.name}</h4>
                                        <IonBadge className="price-badge">{formatPoints(product.points)}</IonBadge>
                                        {product.categories?.length > 0 && (
                                            <div className="category-badges">
                                                {product.categories.slice(0, 2).map((cat, idx) => (
                                                    <IonBadge key={idx} color="light" className="category-badge">{cat.name}</IonBadge>
                                                ))}
                                                {product.categories.length > 2 && <span className="more-categories">+{product.categories.length - 2}</span>}
                                            </div>
                                        )}
                                    </div>
                                </IonItem>
                            ))
                        )}
                    </IonList>
                    {userProducts.length > 3 && (
                        <IonButton expand="block" className="view-all-btn" onClick={() => setShowAllProducts(!showAllProducts)}>
                            {showAllProducts ? "Mostrar menos" : "Ver todos"}
                        </IonButton>
                    )}
                </div>
            );
        }

        if (activeTab === "deseados") {
            const items = showAllSavedProducts ? savedProducts : savedProducts.slice(0, 3);

            return (
                <div className="tab-content">
                    <h3 className="tab-title">Lista de deseos ({savedProducts.length})</h3>
                    <IonList style={{ backgroundColor: "white" }}>
                        {loadingSaved ? (
                            <div className="loading-message">Cargando productos guardados...</div>
                        ) : items.length === 0 ? (
                            <div className="empty-message">No tienes productos guardados</div>
                        ) : (
                            items.map(product => (
                                <IonItem key={product.id} className="item-card wishlist-item">
                                    <IonThumbnail slot="start">
                                        <img src={getProductImage(product.imagenes)} alt={product.name} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg?height=60&width=60"; }} />
                                    </IonThumbnail>
                                    <div className="item-details">
                                        <h4>{product.name}</h4>
                                        <IonBadge color="tertiary" className="price-badge secondary">{formatPoints(product.points)}</IonBadge>
                                        <div className="product-seller"><small>Vendedor: {product.profile.nickname}</small></div>
                                        {product.categories?.length > 0 && (
                                            <div className="category-badges">
                                                {product.categories.slice(0, 2).map((cat, idx) => (
                                                    <IonBadge key={idx} color="light" className="category-badge">{cat.name}</IonBadge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </IonItem>
                            ))
                        )}
                    </IonList>
                    {savedProducts.length > 3 && (
                        <IonButton expand="block" className="view-all-btn" onClick={() => setShowAllSavedProducts(!showAllSavedProducts)}>
                            {showAllSavedProducts ? "Mostrar menos" : "Ver todos"}
                        </IonButton>
                    )}
                </div>
            );
        }

        // Reseñas por defecto
        return (
            <div className="tab-content reviews-tab">
                {reviews.map(review => (
                    <div key={review.id} className="review-card">
                        <div className="review-user">
                            <img src={review.image} alt={review.reviewer} className="reviewer-img" />
                            <div className="review-product">
                                <h4>{review.product}</h4>
                                <p>{review.comment}</p>
                                <span className="reviewer-name">Por {review.reviewer}</span>
                            </div>
                        </div>
                        <div className="review-meta">
                            <div className="review-stars">{renderStars(review.rating)}</div>
                            <div className="review-date">{review.date}</div>
                            <IonIcon icon={bookmarkOutline} className="bookmark-icon" />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const isPremium = profileData?.premium !== "FREE";

    // Render
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="toolbar">
                    <IonMenuButton slot="start" />
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className={sessionStorage.getItem('modoOscuroClaro') === 'true' ? 'dark-mode' : ''}>
                <IonLoading isOpen={loading} message="Cargando perfil..." />

                <div className="hero-banner" onClick={handleBannerClick} style={{ backgroundImage: bannerImage ? `url(${bannerImage})` : 'none' }}>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
                    {!bannerImage && <span>Haz clic para añadir una imagen de fondo</span>}
                </div>

                <section className="profile-header">
                    <IonGrid>
                        <IonRow>
                            <IonCol size="8" className="profile-info">
                                {isPremium && (
                                    <IonButton shape="round" fill="solid" className="pro-badge">
                                        <IonIcon icon={starOutline} slot="start" /> PRO
                                    </IonButton>
                                )}
                                <h2 className="profile-name">{userInfo.name}</h2>
                                <div className="rating">
                                    <div className="stars-container">{renderStars(userInfo.rating)}</div>
                                    <IonLabel className="reviews">({userInfo.totalReviews})</IonLabel>
                                </div>
                                <div className="stats-small">
                                    <div><Building size={10} /> <span>100% fiable</span></div>
                                    <div><MapPin size={10} /> <span>31 comprados</span></div>
                                </div>
                                {profileData?.newUser && (
                                    <IonBadge color="success" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                        Nuevo usuario
                                    </IonBadge>
                                )}
                            </IonCol>
                            <IonCol size="4" className="avatar-col">
                                <IonAvatar className="avatar">
                                    <img src={profileData?.avatar || "/placeholder.svg?height=70&width=70"} alt="User avatar" />
                                </IonAvatar>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </section>

                <section className="profile-tabs">
                    <IonSegment value={activeTab} onIonChange={e => setActiveTab(String(e.detail.value))} className="segment-container">
                        <IonSegmentButton value="enVenta">
                            <IonIcon icon={cartOutline} /><IonLabel>En venta</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="deseados">
                            <IonIcon icon={heartOutline} /><IonLabel>Deseados</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="reseñas">
                            <IonIcon icon={chatbubbleOutline} /><IonLabel>Reseñas</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                    <div className="tab-container">{renderTabContent()}</div>
                </section>
            </IonContent>
        </IonPage>
    );
}

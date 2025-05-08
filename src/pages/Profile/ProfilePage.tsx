"use client"

import { useEffect, useState } from "react"
import { useHistory } from "react-router-dom";
import "./ProfilePage.css"
import ProfileService, { ProfileDTO, ProductDTO } from "../../Services/ProfileService";

import {
    IonAvatar,
    IonBadge,
    IonButton,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonPage,
    IonRow,
    IonSegment,
    IonSegmentButton,
    IonTextarea,
    IonThumbnail,
    IonToolbar,
    IonLoading
} from "@ionic/react"

import {
    bookmarkOutline,
    cartOutline,
    chatbubbleOutline,
    heartOutline,
    informationCircleOutline,
    star,
    starOutline,
} from "ionicons/icons"

import { Building, MapPin } from "lucide-react"

export default function ProfilePage() {
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<ProfileDTO | null>(null);
    const [userProducts, setUserProducts] = useState<ProductDTO[]>([]);
    const [showAllProducts, setShowAllProducts] = useState(false);

    const [activeTab, setActiveTab] = useState("reseñas")

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
        biography: "",
    })

    // Cargar datos del perfil y productos al montar el componente
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

                // Cargar los productos del usuario
                const products = await ProfileService.getUserProducts();
                setUserProducts(products);

                // Actualizar la información del usuario con los datos recibidos
                setUserInfo(prevInfo => ({
                    ...prevInfo,
                    name: profileInfo.nickname || "Usuario",
                    itemsForSale: products.length,
                }));

                // Resetear el estado de visualización cuando se cargan nuevos productos
                setShowAllProducts(false);
            } catch (error) {
                console.error("Error al cargar perfil o productos:", error);
                // Manejar el error según sea necesario
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [history]);

    // Función para manejar errores de carga de imágenes
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        // Usamos la primera letra del nombre como imagen de respaldo
        const firstLetter = userInfo.name.charAt(0).toUpperCase();
        target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23cccccc"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="40" text-anchor="middle" dominant-baseline="middle" fill="%23ffffff"%3E${firstLetter}%3C/text%3E%3C/svg%3E`;
    };

    const wishlistItems = [
        { id: 1, title: "PlayStation 5", price: "499€", image: "/placeholder.svg?height=60&width=60" },
        { id: 2, title: "MacBook Pro", price: "1299€", image: "/placeholder.svg?height=60&width=60" },
    ]

    const reviews = [
        {
            id: 1,
            product: "Samsung DS2 5G",
            comment: "Todo perfecto",
            reviewer: "rafa",
            rating: 5,
            date: "26 Aug 2024",
            image: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 2,
            product: "Apple AirPods",
            comment: "Excelente servicio",
            reviewer: "maria",
            rating: 4,
            date: "15 Sep 2024",
            image: "/placeholder.svg?height=40&width=40",
        },
    ]

    const handleInputChange = (field: keyof typeof userInfo, value: string) => {
        setUserInfo({ ...userInfo, [field]: value })
    }

    const renderStars = (rating: number) =>
        Array.from({ length: 5 }, (_, i) => (
            <IonIcon
                key={i}
                icon={i < rating ? star : starOutline}
                className={i < rating ? "star-filled" : "star-outline"}
            />
        ))

    // Helper para formatear puntos como precio
    const formatPoints = (points: number): string => {
        return `${points} pts`;
    }

    // Helper para obtener imagen del producto o placeholder
    const getProductImage = (images: string[]): string => {
        return images && images.length > 0
            ? images[0]
            : "/placeholder.svg?height=60&width=60";
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case "enVenta":
                // Determinar qué productos mostrar según el estado de showAllProducts
                const displayProducts = showAllProducts
                    ? userProducts
                    : userProducts.slice(0, 3);

                return (
                    <div className="tab-content">
                        <h3 className="tab-title">Artículos en venta ({userInfo.itemsForSale})</h3>
                        <IonList lines="none" style={{ backgroundColor: "white" }}>
                            {loading ? (
                                <div className="loading-message">Cargando productos...</div>
                            ) : userProducts.length === 0 ? (
                                <div className="empty-message">No tienes productos en venta</div>
                            ) : (
                                displayProducts.map((product) => (
                                    <IonItem key={product.id} className="item-card">
                                        <IonThumbnail slot="start">
                                            <img
                                                src={getProductImage(product.imagenes)}
                                                alt={product.name}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "/placeholder.svg?height=60&width=60";
                                                }}
                                            />
                                        </IonThumbnail>
                                        <div className="item-details">
                                            <h4>{product.name}</h4>
                                            <IonBadge className="price-badge">{formatPoints(product.points)}</IonBadge>
                                            {product.categories && product.categories.length > 0 && (
                                                <div className="category-badges">
                                                    {product.categories.slice(0, 2).map((category, index) => (
                                                        <IonBadge key={index} color="light" className="category-badge">
                                                            {category.name} {/* Usamos category.name en lugar de category */}
                                                        </IonBadge>
                                                    ))}
                                                    {product.categories.length > 2 && (
                                                        <span className="more-categories">+{product.categories.length - 2}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </IonItem>
                                ))
                            )}
                        </IonList>
                        {userProducts.length > 3 && (
                            <IonButton
                                expand="block"
                                className="view-all-btn"
                                onClick={() => setShowAllProducts(!showAllProducts)}
                            >
                                {showAllProducts ? "Mostrar menos" : "Ver todos"}
                            </IonButton>
                        )}
                    </div>
                )

            case "deseados":
                return (
                    <div className="tab-content">
                        <h3 className="tab-title">Lista de deseos ({wishlistItems.length})</h3>
                        <IonList style={{ backgroundColor: "white" }}>
                            {wishlistItems.map((item) => (
                                <IonItem key={item.id} className="item-card wishlist-item">
                                    <IonThumbnail slot="start">
                                        <img src={item.image} alt={item.title} />
                                    </IonThumbnail>
                                    <div className="item-details">
                                        <h4>{item.title}</h4>
                                        <IonBadge color="tertiary" className="price-badge secondary">{item.price}</IonBadge>
                                    </div>
                                </IonItem>
                            ))}
                        </IonList>
                        <IonButton expand="block" className="view-all-btn">Ver todos</IonButton>
                    </div>
                )

            case "reseñas":
                return (
                    <div className="tab-content reviews-tab">
                        {reviews.map((review) => (
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
                )

            case "info":
                return (
                    <div className="tab-content">
                        <h3 className="tab-title">Tu información</h3>
                        <IonList style={{ backgroundColor: "white" }}>
                            {[
                                { label: "Nombre", value: profileData?.nickname || "", field: "fullName" },
                                { label: "Ciudad", value: userInfo.city, field: "city" },
                                { label: "Hobby", value: userInfo.hobby, field: "hobby" },
                                { label: "Redes Sociales", value: userInfo.socialMedia, field: "socialMedia" },
                            ].map(({ label, value, field }) => (
                                <IonItem key={field} className="input-item">
                                    <IonLabel color="primary">{label}</IonLabel>
                                    <IonInput value={value} readonly onIonChange={(e: CustomEvent) => handleInputChange(field as keyof typeof userInfo, e.detail.value || "")}>
                                    </IonInput>
                                </IonItem>
                            ))}
                            <IonItem className="input-item">
                                <IonLabel color="primary">Biografía</IonLabel>
                                <IonTextarea
                                    rows={4}
                                    value={userInfo.biography}
                                    readonly
                                    onIonChange={(e) => handleInputChange("biography", e.detail.value || "")}
                                />
                            </IonItem>
                        </IonList>
                    </div>
                )

            default:
                return null
        }
    }

    // Determinar si el usuario es premium
    const isPremium = profileData?.premium !== "FREE";

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="toolbar">
                    <IonMenuButton slot="start" />
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonLoading isOpen={loading} message="Cargando perfil..." />

                <div className="hero-banner"><span>Aquí va una imagen de background</span></div>
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
                                    <span className="reviews">({userInfo.totalReviews})</span>
                                </div>
                                <div className="stats-small">
                                    <div><Building size={16} /> <span>100% fiable</span></div>
                                    <div><MapPin size={16} /> <span>31 comprados</span></div>
                                </div>
                                {profileData?.newUser && (
                                    <IonBadge color="success">Nuevo usuario</IonBadge>
                                )}
                            </IonCol>
                            <IonCol size="4" className="avatar-col">
                                <IonAvatar className="avatar">
                                    {profileData?.avatar ? (
                                        <img
                                            src={profileData.avatar}
                                            alt="User avatar"
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        <img
                                            src="/placeholder.svg?height=70&width=70"
                                            alt="User avatar"
                                            onError={handleImageError}
                                        />
                                    )}
                                </IonAvatar>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </section>
                <section className="profile-tabs">
                    <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(String(e.detail.value))} className="segment-container">
                        <IonSegmentButton value="enVenta">
                            <IonIcon icon={cartOutline} />
                            <IonLabel>En venta</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="deseados">
                            <IonIcon icon={heartOutline} />
                            <IonLabel>Deseados</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="reseñas">
                            <IonIcon icon={chatbubbleOutline} />
                            <IonLabel>Reseñas</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="info">
                            <IonIcon icon={informationCircleOutline} />
                            <IonLabel>Info</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                    <div className="tab-container">{renderTabContent()}</div>
                </section>
            </IonContent>
        </IonPage>
    )
}
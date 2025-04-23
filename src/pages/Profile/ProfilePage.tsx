"use client"

import { useState } from "react"
import {
    IonContent,
    IonPage,
    IonIcon,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonAvatar,
    IonInput,
    IonTextarea,
    IonItem,
    IonMenuButton,
    IonToolbar,
    IonHeader,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonThumbnail,
    IonBadge,
} from "@ionic/react"
import {
    starOutline,
    star,
    informationCircleOutline,
    cartOutline,
    heartOutline,
    chatbubbleOutline,
    bookmarkOutline,
} from "ionicons/icons"
import { Building, MapPin } from "lucide-react"
import "./ProfilePage.css"

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("reseñas")
    const [userInfo, setUserInfo] = useState({
        name: "Sebastian",
        rating: 4,
        totalReviews: 349,
        itemsForSale: 33,
        trades: 249,
        fullName: "",
        city: "",
        hobby: "",
        socialMedia: "",
        biography: "",
    })

    // Dummy data
    const itemsForSale = [
        { id: 1, title: "Zapatillas Nike", price: "89€", image: "/placeholder.svg?height=60&width=60" },
        { id: 2, title: "iPhone 12", price: "450€", image: "/placeholder.svg?height=60&width=60" },
        { id: 3, title: "Camiseta Adidas", price: "25€", image: "/placeholder.svg?height=60&width=60" },
    ]

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

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <IonIcon key={i} icon={i < rating ? star : starOutline} className={i < rating ? "star-filled" : "star-outline"} />
        ))
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case "enVenta":
                return (
                    <div className="tab-content">
                        <h3 className="tab-title">Artículos en venta ({userInfo.itemsForSale})</h3>
                        <IonList lines="none" style={{ backgroundColor: "white" }}>
                            {itemsForSale.map((item) => (
                                <IonItem key={item.id} lines="none" className="item-card">
                                    <IonThumbnail slot="start">
                                        <img src={item.image || "/placeholder.svg"} alt={item.title} />
                                    </IonThumbnail>
                                    <div className="item-details">
                                        <h4>{item.title}</h4>
                                        <IonBadge className="price-badge">{item.price}</IonBadge>
                                    </div>
                                </IonItem>
                            ))}
                        </IonList>
                        <IonButton expand="block" className="view-all-btn">
                            Ver todos
                        </IonButton>
                    </div>
                )

            case "deseados":
                return (
                    <div className="tab-content">
                        <h3 className="tab-title">Lista de deseos ({userInfo.trades})</h3>
                        <IonList style={{ backgroundColor: "white" }}>
                            {wishlistItems.map((item) => (
                                <IonItem key={item.id} lines="full" className="item-card wishlist-item">
                                    <IonThumbnail slot="start">
                                        <img src={item.image || "/placeholder.svg"} alt={item.title} />
                                    </IonThumbnail>
                                    <div className="item-details">
                                        <h4>{item.title}</h4>
                                        <IonBadge color="tertiary" className="price-badge secondary">
                                            {item.price}
                                        </IonBadge>
                                    </div>
                                </IonItem>
                            ))}
                        </IonList>
                        <IonButton expand="block" className="view-all-btn">
                            Ver todos
                        </IonButton>
                    </div>
                )

            case "reseñas":
                return (
                    <div className="tab-content reviews-tab">
                        {reviews.map((review) => (
                            <div key={review.id} className="review-card">
                                <div className="review-user">
                                    <img src={review.image || "/placeholder.svg"} alt={review.reviewer} className="reviewer-img" />
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
                            <IonItem lines="none" className="input-item">
                                <IonLabel color="primary">Nombre</IonLabel>
                                <IonInput
                                    labelPlacement="floating"
                                    value={userInfo.fullName}
                                    readonly={true}
                                    onIonChange={(e) => handleInputChange("fullName", e.detail.value || "")}
                                />
                            </IonItem>
                            <IonItem lines="none" className="input-item">
                                <IonLabel color="primary">Ciudad</IonLabel>
                                <IonInput
                                    labelPlacement="floating"
                                    value={userInfo.city}
                                    readonly={true}
                                    onIonChange={(e) => handleInputChange("city", e.detail.value || "")}
                                />
                            </IonItem>
                            <IonItem lines="none" className="input-item">
                                <IonLabel color="primary">Hobby</IonLabel>
                                <IonInput
                                    labelPlacement="floating"
                                    value={userInfo.hobby}
                                    readonly={true}
                                    onIonChange={(e) => handleInputChange("hobby", e.detail.value || "")}
                                />
                            </IonItem>
                            <IonItem lines="none" className="input-item">
                                <IonLabel color="primary">Redes Sociales</IonLabel>
                                <IonInput
                                    labelPlacement="floating"
                                    value={userInfo.socialMedia}
                                    readonly={true}
                                    onIonChange={(e) => handleInputChange("socialMedia", e.detail.value || "")}
                                />
                            </IonItem>
                            <IonItem lines="none" className="input-item">
                                <IonLabel color="primary">Biografía</IonLabel>
                                <IonTextarea
                                    labelPlacement="floating"
                                    rows={4}
                                    value={userInfo.biography}
                                    readonly={true}
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

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="toolbar">
                    <IonMenuButton slot="start" />
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <div className="hero-banner">
                    <span>Aquí va una imagen de background</span>
                </div>
                <section className="profile-header">
                    <IonGrid>
                        <IonRow>
                            <IonCol size="8" className="profile-info">
                                <IonButton shape="round" fill="solid" className="pro-badge">
                                    <IonIcon icon={starOutline} slot="start" /> PRO
                                </IonButton>
                                <h2 className="profile-name">{userInfo.name}</h2>
                                <div className="rating">
                                    <div className="stars-container">{renderStars(userInfo.rating)}</div>
                                    <span className="reviews">({userInfo.totalReviews})</span>
                                </div>
                                <div className="stats-small">
                                    <div>
                                        <Building size={16} /> <span>100% fiable</span>
                                    </div>
                                    <div>
                                        <MapPin size={16} /> <span>31 comprados</span>
                                    </div>
                                </div>
                            </IonCol>
                            <IonCol size="4" className="avatar-col">
                                <IonAvatar className="avatar">
                                    <img src="/placeholder.svg?height=70&width=70" alt="User avatar" />
                                </IonAvatar>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </section>

                <section className="profile-tabs">
                    <IonSegment
                        value={activeTab}
                        onIonChange={(e) => setActiveTab(String(e.detail.value!))}
                        className="segment-container"
                    >
                        <IonSegmentButton value="enVenta" className="segment-button">
                            <IonIcon icon={cartOutline} />
                            <IonLabel>En venta</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="deseados" className="segment-button">
                            <IonIcon icon={heartOutline} />
                            <IonLabel>Deseados</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="reseñas" className="segment-button">
                            <IonIcon icon={chatbubbleOutline} />
                            <IonLabel>Reseñas</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="info" className="segment-button">
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

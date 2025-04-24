"use client"

import { useEffect, useState } from "react"
import { useHistory } from "react-router-dom";
import "./ProfilePage.css"

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

    useEffect(() => {
        if (!sessionStorage.getItem("token")) {
            history.push("/login");
        }
    }, [history]);


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

    const renderStars = (rating: number) =>
        Array.from({ length: 5 }, (_, i) => (
            <IonIcon
                key={i}
                icon={i < rating ? star : starOutline}
                className={i < rating ? "star-filled" : "star-outline"}
            />
        ))

    const renderTabContent = () => {
        switch (activeTab) {
            case "enVenta":
                return (
                    <div className="tab-content">
                        <h3 className="tab-title">Artículos en venta ({userInfo.itemsForSale})</h3>
                        <IonList lines="none" style={{ backgroundColor: "white" }}>
                            {itemsForSale.map((item) => (
                                <IonItem key={item.id} className="item-card">
                                    <IonThumbnail slot="start">
                                        <img src={item.image} alt={item.title} />
                                    </IonThumbnail>
                                    <div className="item-details">
                                        <h4>{item.title}</h4>
                                        <IonBadge className="price-badge">{item.price}</IonBadge>
                                    </div>
                                </IonItem>
                            ))}
                        </IonList>
                        <IonButton expand="block" className="view-all-btn">Ver todos</IonButton>
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
                                { label: "Nombre", value: userInfo.fullName, field: "fullName" },
                                { label: "Ciudad", value: userInfo.city, field: "city" },
                                { label: "Hobby", value: userInfo.hobby, field: "hobby" },
                                { label: "Redes Sociales", value: userInfo.socialMedia, field: "socialMedia" },
                            ].map(({ label, value, field }) => (
                                <IonItem key={field} className="input-item">
                                    <IonLabel color="primary">{label}</IonLabel>
                                    <IonInput value={value} readonly onIonChange={(e: CustomEvent) => handleInputChange("fullName", e.detail.value || "")}>

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

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="toolbar">
                    <IonMenuButton slot="start" />
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <div className="hero-banner"><span>Aquí va una imagen de background</span></div>
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
                                    <div><Building size={16} /> <span>100% fiable</span></div>
                                    <div><MapPin size={16} /> <span>31 comprados</span></div>
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
                    <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(String(e.detail.value))} className="segment-container">
                        <IonSegmentButton value="enVenta"><IonIcon icon={cartOutline} /><IonLabel>En venta</IonLabel></IonSegmentButton>
                        <IonSegmentButton value="deseados"><IonIcon icon={heartOutline} /><IonLabel>Deseados</IonLabel></IonSegmentButton>
                        <IonSegmentButton value="reseñas"><IonIcon icon={chatbubbleOutline} /><IonLabel>Reseñas</IonLabel></IonSegmentButton>
                        <IonSegmentButton value="info"><IonIcon icon={informationCircleOutline} /><IonLabel>Info</IonLabel></IonSegmentButton>
                    </IonSegment>
                    <div className="tab-container">{renderTabContent()}</div>
                </section>
            </IonContent>
        </IonPage>
    )
}

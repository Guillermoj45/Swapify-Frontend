import React, { useState, useEffect } from 'react';
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
    IonItem, IonMenuButton, IonToolbar, IonHeader
} from '@ionic/react';
import { addOutline, starOutline } from 'ionicons/icons';
import { FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';
import Navegation from "../../components/Navegation";

const ProfilePage = () => {
    const [ isDesktop, setIsDesktop] = useState(false);
    const [userInfo, setUserInfo] = useState({
        name: 'Sebastian',
        rating: 4.9,
        totalReviews: 349,
        itemsForSale: 33,
        trades: 249,
        fullName: '',
        city: '',
        hobby: '',
        socialMedia: '',
        biography: ''
    });

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

    const handleInputChange = (field: keyof typeof userInfo, value: string) => {
        setUserInfo({
            ...userInfo,
            [field]: value
        });
    };

    return (
        <IonPage>

            <Navegation isDesktop={isDesktop} />

            <IonHeader>
                <IonToolbar color="primary">
                    <IonMenuButton slot="start" />
                </IonToolbar>
            </IonHeader>

            <IonContent id="main-content" fullscreen style={{ '--background': '#0ea5e9' }}>
                {/* Background image section */}
                <div style={{
                    height: '150px',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#6b7280'
                }}>
                    Aquí va una imagen de background
                </div>

                {/* User profile header */}
                <div style={{ backgroundColor: '#0ea5e9', padding: '0 15px 15px 15px' }}>
                    <IonGrid>
                        <IonRow>
                            <IonCol size="8">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <IonButton
                                        fill="solid"
                                        color="light"
                                        size="small"
                                        style={{
                                            '--border-radius': '20px',
                                            marginRight: '10px',
                                            '--background': 'rgba(255, 255, 255, 0.3)'
                                        }}
                                    >
                                        <IonIcon icon={starOutline} slot="start" />
                                        PRO
                                    </IonButton>
                                </div>
                                <h2 style={{
                                    margin: '8px 0',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '24px'
                                }}>
                                    {userInfo.name}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{
                                        display: 'flex',
                                        backgroundColor: '#fcd34d',
                                        borderRadius: '10px',
                                        padding: '2px 6px',
                                        alignItems: 'center',
                                        marginRight: '5px'
                                    }}>
                                        <IonIcon icon={starOutline} style={{ color: 'white' }} />
                                        <span style={{ color: 'white', marginLeft: '3px' }}>{userInfo.rating}</span>
                                    </div>
                                    <span style={{ color: 'white', fontSize: '12px' }}>
                    ({userInfo.totalReviews})
                  </span>
                                </div>
                                <div style={{ display: 'flex', marginTop: '10px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginRight: '15px',
                                        color: 'white',
                                        fontSize: '12px'
                                    }}>
                                        <FaBuilding style={{ marginRight: '5px' }} />
                                        <span>100% fiable</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: 'white',
                                        fontSize: '12px'
                                    }}>
                                        <FaMapMarkerAlt style={{ marginRight: '5px' }} />
                                        <span>31 comprados</span>
                                    </div>
                                </div>
                            </IonCol>
                            <IonCol size="4" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                                <IonAvatar style={{
                                    width: '60px',
                                    height: '60px',
                                    border: '3px solid white'
                                }}>
                                    <img src="https://via.placeholder.com/60" alt="User avatar" />
                                </IonAvatar>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </div>

                {/* User stats */}
                <div style={{
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-around',
                    padding: '15px 0',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '22px', color: 'black' }}>{userInfo.itemsForSale}</div>
                        <div style={{ color: 'black', fontSize: '14px' }}>En venta</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '22px', color: 'black' }}>{userInfo.trades}</div>
                        <div style={{ color: 'black', fontSize: '14px' }}>Deseados</div>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            border: '1px solid black',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <IonIcon icon={addOutline} style={{ fontSize: '24px', color: 'black' }}/>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '2px' }}>Info</div>
                    </div>
                </div>

                {/* User form */}
                <div style={{ backgroundColor: '#0ea5e9', padding: '15px' }}>
                    <IonItem lines="none" style={{ '--background': 'white', '--border-radius': '10px', marginBottom: '10px' }}>
                        <IonInput
                            label="Nombre completo:"
                            labelPlacement="floating"
                            value={userInfo.fullName}
                            onIonChange={(e) => handleInputChange('fullName', e.detail.value ?? '')}
                            style={{color:'black', fontSize: '16px'}}
                        />
                    </IonItem>

                    <IonItem lines="none" style={{ '--background': 'white', '--border-radius': '10px', marginBottom: '10px' }}>
                        <IonInput
                            label="Ciudad:"
                            labelPlacement="floating"
                            value={userInfo.city}
                            onIonChange={(e) => handleInputChange('city', e.detail.value ?? '')}
                            style={{color:'black', fontSize: '16px'}}
                        />
                    </IonItem>

                    <IonItem lines="none" style={{ '--background': 'white', '--border-radius': '10px', marginBottom: '10px' }}>
                        <IonInput
                            label="Hobby:"
                            labelPlacement="floating"
                            value={userInfo.hobby}
                            onIonChange={(e) => handleInputChange('hobby', e.detail.value ?? '')}
                            style={{color:'black', fontSize: '16px'}}
                        />
                    </IonItem>

                    <IonItem lines="none" style={{ '--background': 'white', '--border-radius': '10px', marginBottom: '10px' }}>
                        <IonInput
                            label="Redes sociales:"
                            labelPlacement="floating"
                            value={userInfo.socialMedia}
                            onIonChange={(e) => handleInputChange('socialMedia', e.detail.value ?? '')}
                            style={{color:'black', fontSize: '16px'}}
                        />
                    </IonItem>

                    <IonItem lines="none" style={{ '--background': 'white', '--border-radius': '10px', marginBottom: '10px' }}>
                        <IonTextarea
                            label="Biografía:"
                            labelPlacement="floating"
                            value={userInfo.biography}
                            onIonChange={(e) => handleInputChange('biography', e.detail.value ?? '')}
                            rows={4}
                            style={{color:'black', fontSize: '16px'}}
                        />
                    </IonItem>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ProfilePage;
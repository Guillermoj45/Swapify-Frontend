import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButtons,
    IonMenuButton
} from '@ionic/react';
import Navegation from "../../components/Navegation";

const ProductsPage = () => {
    const [searchText, setSearchText] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('Hoga');
    const [isDesktop, setIsDesktop] = useState(false);

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

    // Datos de ejemplo para las tarjetas de objetos
    const items = [
        { id: 1, name: 'Objeto1', points: 100 },
        { id: 2, name: 'Objeto1', points: 100 },
        { id: 3, name: 'Objeto1', points: 100 },
        { id: 4, name: 'Objeto1', points: 100 },
        { id: 5, name: 'Objeto1', points: 100 },
        { id: 6, name: 'Objeto1', points: 100 },
        { id: 1, name: 'Objeto1', points: 100 },
        { id: 2, name: 'Objeto1', points: 100 },
        { id: 3, name: 'Objeto1', points: 100 },
        { id: 4, name: 'Objeto1', points: 100 },
        { id: 5, name: 'Objeto1', points: 100 },
        { id: 6, name: 'Objeto1', points: 100 }
    ];

    // Filtros disponibles
    const filters = ['Hoga', 'Tecno', 'Cuadr', 'Rafa', 'Javi'];

    // Renderizar el menú de navegación y las tarjetas
    return (
        <>
            <IonPage id="main-content">
                <IonHeader>
                    <IonToolbar color="primary">
                        {isDesktop && (
                            <IonButtons slot="start">
                                <IonMenuButton />
                            </IonButtons>
                        )}
                        <IonSearchbar
                            value={searchText}
                            onIonChange={e => setSearchText(e.detail.value ?? '')}
                            placeholder="Buscar"
                            showCancelButton="never"
                            className="ion-no-padding"
                            style={{ '--background': 'white', '--border-radius': '20px' }}
                        />
                    </IonToolbar>
                </IonHeader>

                <IonContent fullscreen style={{ '--background': '#0ea5e9' }}>
                    {/* Chips de filtros */}
                    <div className="ion-padding-horizontal ion-padding-top" style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex' }}>
                        {filters.map((filter) => (
                            <IonChip
                                key={filter}
                                color={selectedFilter === filter ? 'primary' : 'light'}
                                onClick={() => setSelectedFilter(filter)}
                                style={{ marginRight: '5px' }}
                            >
                                <IonLabel>{filter}</IonLabel>
                            </IonChip>
                        ))}
                    </div>

                    {/* Grid de tarjetas */}
                    <IonGrid>
                        <IonRow>
                            {items.map((item) => (
                                <IonCol size="6" key={item.id}>
                                    <IonCard style={{ margin: '8px', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '150px',
                                            backgroundColor: '#6b7280',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                            {/* Área para la imagen */}
                                        </div>
                                        <IonCardContent style={{ backgroundColor: 'white', padding: '10px', textAlign: 'left' }}>
                                            <h3 style={{ margin: '0', fontWeight: 'bold' }}>{item.name}</h3>
                                            <p style={{ margin: '0', color: '#6b7280' }}>{item.points} ptos</p>
                                        </IonCardContent>
                                    </IonCard>
                                </IonCol>
                            ))}
                        </IonRow>
                    </IonGrid>
                </IonContent>

                <Navegation isDesktop={isDesktop} />

            </IonPage>
        </>
    );
};

export default ProductsPage;
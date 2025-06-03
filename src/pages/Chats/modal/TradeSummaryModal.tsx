"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { IonIcon } from "@ionic/react"
import { close, checkmarkCircle, swapHorizontal } from "ionicons/icons"
import type { Product } from "../../../Services/ProductService"
import { ProductService } from "../../../Services/ProductService"
import { ProductMessage } from "./productMessage"

interface TradeSummaryModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirmTrade: () => Promise<void>
    traderProductIds: string[]
    nonTraderProductIds: string[]
    traderNickname: string
    nonTraderNickname: string
    currentUserIsTrader: boolean
    productDelChatName?: string
}

export const TradeSummaryModal: React.FC<TradeSummaryModalProps> = ({
                                                                        isOpen,
                                                                        onClose,
                                                                        onConfirmTrade,
                                                                        traderProductIds,
                                                                        nonTraderProductIds,
                                                                        traderNickname,
                                                                        nonTraderNickname,
                                                                        currentUserIsTrader,
                                                                        productDelChatName,
                                                                    }) => {
    const [traderProducts, setTraderProducts] = useState<Product[]>([])
    const [nonTraderProducts, setNonTraderProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [confirming, setConfirming] = useState(false)

    useEffect(() => {
        const loadProducts = async () => {
            if (!isOpen) return

            try {
                setLoading(true)
                setError(null)

                console.log("🔄 Cargando productos para el modal:", {
                    traderProductIds,
                    nonTraderProductIds,
                })

                // Función auxiliar para cargar un producto
                const loadProduct = async (productId: string): Promise<Product> => {
                    try {
                        // Intentar cargar el producto sin profileId primero
                        return await ProductService.getProductById(productId, "")
                    } catch (error) {
                        console.warn(`No se pudo cargar producto ${productId} sin profileId, intentando con ProfileService`)

                        // Si falla, intentar obtener el producto de otra manera
                        // Esto podría requerir una llamada adicional al backend para obtener el profileId
                        throw new Error(`No se pudo cargar el producto ${productId}`)
                    }
                }

                // Cargar productos del trader y non-trader
                const [traderProductsData, nonTraderProductsData] = await Promise.all([
                    Promise.all(traderProductIds.map(loadProduct)),
                    Promise.all(nonTraderProductIds.map(loadProduct)),
                ])

                console.log("✅ Productos cargados:", {
                    trader: traderProductsData,
                    nonTrader: nonTraderProductsData,
                })

                setTraderProducts(traderProductsData)
                setNonTraderProducts(nonTraderProductsData)
            } catch (error) {
                console.error("❌ Error loading trade products:", error)
                setError("No se pudieron cargar los productos del intercambio.")
            } finally {
                setLoading(false)
            }
        }

        loadProducts()
    }, [isOpen, traderProductIds, nonTraderProductIds])

    const calculateTotalPoints = (products: Product[]) => {
        return products.reduce((total, product) => total + product.points, 0)
    }

    const traderTotal = calculateTotalPoints(traderProducts)
    const nonTraderTotal = calculateTotalPoints(nonTraderProducts)
    const pointsDifference = Math.abs(traderTotal - nonTraderTotal)

    const handleConfirmTrade = async () => {
        try {
            setConfirming(true)
            await onConfirmTrade()
        } catch (error) {
            console.error("Error al confirmar intercambio:", error)
            setError("Error al confirmar el intercambio. Inténtalo de nuevo.")
        } finally {
            setConfirming(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="trade-modal-overlay">
            <div className="trade-modal-container">
                <div className="trade-modal-header">
                    <h3>Resumen del Intercambio</h3>
                    {productDelChatName && <p className="product-chat-name">Producto: {productDelChatName}</p>}
                    <button className="trade-modal-close-button" onClick={onClose}>
                        <IonIcon icon={close} />
                    </button>
                </div>

                <div className="trade-modal-content">
                    {loading ? (
                        <div className="trade-modal-loading">
                            <div className="trade-modal-spinner"></div>
                            <p>Cargando productos del intercambio...</p>
                        </div>
                    ) : error ? (
                        <div className="trade-modal-error">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="trade-summary">
                            {/* Productos del trader (dueño del producto del chat) */}
                            <div className="trade-section">
                                <div className="trade-section-header">
                                    <h4>{traderNickname} ofrece:</h4>
                                    <span className="points-total">{traderTotal} puntos</span>
                                </div>
                                <div className="trade-products-grid">
                                    {traderProducts.map((product) => (
                                        <div key={product.id} className="trade-product-item">
                                            <ProductMessage product={product} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Icono de intercambio */}
                            <div className="trade-exchange-icon">
                                <IonIcon icon={swapHorizontal} />
                            </div>

                            {/* Productos del non-trader */}
                            <div className="trade-section">
                                <div className="trade-section-header">
                                    <h4>{nonTraderNickname} ofrece:</h4>
                                    <span className="points-total">{nonTraderTotal} puntos</span>
                                </div>
                                <div className="trade-products-grid">
                                    {nonTraderProducts.map((product) => (
                                        <div key={product.id} className="trade-product-item">
                                            <ProductMessage product={product} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resumen de puntos */}
                            <div className="trade-points-summary">
                                <div className="points-comparison">
                                    <div className="points-item">
                                        <span className="points-label">{traderNickname}:</span>
                                        <span className="points-value">{traderTotal} puntos</span>
                                    </div>
                                    <div className="points-item">
                                        <span className="points-label">{nonTraderNickname}:</span>
                                        <span className="points-value">{nonTraderTotal} puntos</span>
                                    </div>
                                    {pointsDifference > 0 && (
                                        <div className="points-difference">
                                            <span>Diferencia: {pointsDifference} puntos</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mensaje de confirmación */}
                            <div className="trade-confirmation-message">
                                {currentUserIsTrader ? (
                                    <p>Como dueño del producto del chat, puedes confirmar este intercambio.</p>
                                ) : (
                                    <p>Esperando confirmación del dueño del producto...</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="trade-modal-footer">
                    <button className="trade-modal-cancel-button" onClick={onClose} disabled={confirming}>
                        Cancelar
                    </button>
                    {currentUserIsTrader && (
                        <button
                            className="trade-modal-confirm-button"
                            onClick={handleConfirmTrade}
                            disabled={loading || !!error || confirming}
                        >
                            <IonIcon icon={checkmarkCircle} />
                            {confirming ? "Confirmando..." : "Confirmar Intercambio"}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
        .trade-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
          padding: 20px;
        }
        
        .trade-modal-container {
          background-color: var(--ion-background-color, #ffffff);
          border-radius: 12px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .trade-modal-header {
          padding: 20px;
          border-bottom: 1px solid var(--ion-border-color, #d7d8da);
          display: flex;
          flex-direction: column;
          gap: 8px;
          background-color: var(--ion-color-primary, #3880ff);
          color: white;
          position: relative;
        }
        
        .trade-modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        
        .product-chat-name {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
          font-style: italic;
        }
        
        .trade-modal-close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: white;
          padding: 4px;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .trade-modal-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .trade-modal-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        
        .trade-modal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        
        .trade-modal-spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 3px solid var(--ion-color-primary, #3880ff);
          width: 32px;
          height: 32px;
          animation: trade-modal-spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes trade-modal-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .trade-summary {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .trade-section {
          border: 1px solid var(--ion-border-color, #d7d8da);
          border-radius: 12px;
          padding: 16px;
          background-color: var(--ion-card-background, #ffffff);
        }
        
        .trade-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--ion-border-color, #d7d8da);
        }
        
        .trade-section-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--ion-text-color, #000000);
        }
        
        .points-total {
          font-size: 14px;
          font-weight: 600;
          color: var(--ion-color-primary, #3880ff);
          background-color: var(--ion-color-primary-tint, rgba(56, 128, 255, 0.1));
          padding: 4px 12px;
          border-radius: 16px;
        }
        
        .trade-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }
        
        .trade-product-item {
          border: 1px solid var(--ion-border-color, #d7d8da);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .trade-exchange-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 32px;
          color: var(--ion-color-primary, #3880ff);
          margin: 8px 0;
        }
        
        .trade-points-summary {
          background-color: var(--ion-color-light, #f4f5f8);
          border-radius: 12px;
          padding: 16px;
        }
        
        .points-comparison {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .points-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .points-label {
          font-weight: 500;
          color: var(--ion-text-color, #000000);
        }
        
        .points-value {
          font-weight: 600;
          color: var(--ion-color-primary, #3880ff);
        }
        
        .points-difference {
          text-align: center;
          padding-top: 8px;
          border-top: 1px solid var(--ion-border-color, #d7d8da);
          font-size: 14px;
          color: var(--ion-color-warning, #ffce00);
          font-weight: 500;
        }
        
        .trade-confirmation-message {
          text-align: center;
          padding: 16px;
          background-color: var(--ion-color-success-tint, rgba(16, 220, 96, 0.1));
          border-radius: 8px;
          border: 1px solid var(--ion-color-success, #10dc60);
        }
        
        .trade-confirmation-message p {
          margin: 0;
          color: var(--ion-color-success-shade, #0cd448);
          font-weight: 500;
        }
        
        .trade-modal-footer {
          padding: 20px;
          border-top: 1px solid var(--ion-border-color, #d7d8da);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background-color: var(--ion-background-color, #ffffff);
        }
        
        .trade-modal-cancel-button,
        .trade-modal-confirm-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .trade-modal-cancel-button {
          background-color: transparent;
          border: 1px solid var(--ion-border-color, #d7d8da);
          color: var(--ion-text-color, #000000);
        }
        
        .trade-modal-cancel-button:hover:not(:disabled) {
          background-color: var(--ion-color-light, #f4f5f8);
        }
        
        .trade-modal-confirm-button {
          background-color: var(--ion-color-success, #10dc60);
          color: white;
          min-width: 160px;
          justify-content: center;
        }
        
        .trade-modal-confirm-button:hover:not(:disabled) {
          background-color: var(--ion-color-success-shade, #0cd448);
        }
        
        .trade-modal-confirm-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .trade-modal-container {
            max-width: 95vw;
            max-height: 95vh;
          }
          
          .trade-products-grid {
            grid-template-columns: 1fr;
          }
          
          .trade-modal-footer {
            flex-direction: column;
          }
          
          .trade-modal-cancel-button,
          .trade-modal-confirm-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
        </div>
    )
}

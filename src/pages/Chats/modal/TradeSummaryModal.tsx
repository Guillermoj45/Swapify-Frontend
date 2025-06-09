"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { IonIcon } from "@ionic/react"
import { close, checkmarkCircle, swapHorizontal, trendingUp, trendingDown, warningOutline } from "ionicons/icons"
import type { Product } from "../../../Services/ProductService"
import { ProductService } from "../../../Services/ProductService"
import { ProductMessage } from "./productMessage"

interface TradeSummaryModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirmTrade: () => Promise<void>
    traderProductIds: string[]
    nonTraderProductIds: string[]
    traderUserId: string
    nonTraderUserId: string
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
                                                                        traderUserId,
                                                                        nonTraderUserId,
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
                    traderUserId,
                    nonTraderUserId,
                })

                const loadProductsForUser = async (productIds: string[], userId: string): Promise<Product[]> => {
                    const products: Product[] = []

                    for (const productId of productIds) {
                        try {
                            console.log(`📦 Cargando producto ${productId} para usuario ${userId}`)
                            const product = await ProductService.getProductById(productId, userId)
                            products.push(product)
                            console.log(`✅ Producto cargado: ${product.name}`)
                        } catch (error) {
                            console.error(`❌ Error cargando producto ${productId}:`, error)
                            const placeholderProduct: Product = {
                                id: productId,
                                name: "Producto no disponible",
                                description: "No se pudo cargar la información del producto",
                                points: 0,
                                createdAt: "",
                                updatedAt: "",
                                imagenes: [],
                                profile: { id: userId, nickname: "Usuario", avatar: "", banAt: false, premium: "", newUser: false, ubicacion: "" },
                                categories: [],
                                newUser: false, // Agregado para cumplir con la interfaz Product
                            }
                            products.push(placeholderProduct)
                        }
                    }

                    return products
                }

                const [traderProductsData, nonTraderProductsData] = await Promise.all([
                    loadProductsForUser(traderProductIds, traderUserId),
                    loadProductsForUser(nonTraderProductIds, nonTraderUserId),
                ])

                console.log("✅ Todos los productos cargados:", {
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
    }, [isOpen, traderProductIds, nonTraderProductIds, traderUserId, nonTraderUserId])

    const calculateTotalPoints = (products: Product[]) => {
        return products.reduce((total, product) => total + product.points, 0)
    }

    const traderTotal = calculateTotalPoints(traderProducts)
    const nonTraderTotal = calculateTotalPoints(nonTraderProducts)
    const pointsDifference = traderTotal - nonTraderTotal
    const absolutePointsDifference = Math.abs(pointsDifference)

    // NUEVA FUNCIONALIDAD: Validación de diferencia de puntos
    const isPointsDifferenceExcessive = absolutePointsDifference > 200
    const canConfirmTrade = !loading && !error && !isPointsDifferenceExcessive

    const handleConfirmTrade = async () => {
        if (!canConfirmTrade) {
            console.warn("❌ No se puede confirmar el intercambio: diferencia de puntos excesiva")
            return
        }

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
                {/* Header moderno con gradiente */}
                <div className="trade-modal-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <IonIcon icon={swapHorizontal} />
                        </div>
                        <div className="header-text">
                            <h3>Resumen del Intercambio</h3>
                            {productDelChatName && <p className="product-chat-name">Producto: {productDelChatName}</p>}
                        </div>
                    </div>
                    <button className="trade-modal-close-button" onClick={onClose}>
                        <IonIcon icon={close} />
                    </button>
                </div>

                <div className="trade-modal-content">
                    {loading ? (
                        <div className="trade-modal-loading">
                            <div className="loading-spinner">
                                <div className="spinner-ring"></div>
                                <div className="spinner-ring"></div>
                                <div className="spinner-ring"></div>
                            </div>
                            <p>Cargando productos del intercambio...</p>
                        </div>
                    ) : error ? (
                        <div className="trade-modal-error">
                            <div className="error-icon">⚠️</div>
                            <p>{error}</p>
                            <button className="retry-button" onClick={() => window.location.reload()}>
                                Recargar página
                            </button>
                        </div>
                    ) : (
                        <div className="trade-summary">
                            {/* Resumen de puntos destacado */}
                            <div className="points-summary-card">
                                <div className="points-comparison">
                                    <div className="user-points">
                                        <div className="user-info">
                                            <div className="user-avatar">{traderNickname.charAt(0).toUpperCase()}</div>
                                            <span className="user-name">{traderNickname}</span>
                                        </div>
                                        <div className="points-value">{traderTotal} pts</div>
                                    </div>

                                    <div className="vs-divider">
                                        <div className="exchange-icon">
                                            <IonIcon icon={swapHorizontal} />
                                        </div>
                                    </div>

                                    <div className="user-points">
                                        <div className="user-info">
                                            <div className="user-avatar">{nonTraderNickname.charAt(0).toUpperCase()}</div>
                                            <span className="user-name">{nonTraderNickname}</span>
                                        </div>
                                        <div className="points-value">{nonTraderTotal} pts</div>
                                    </div>
                                </div>

                                {pointsDifference !== 0 && (
                                    <div
                                        className={`points-difference ${pointsDifference > 0 ? "positive" : "negative"} ${isPointsDifferenceExcessive ? "excessive" : ""}`}
                                    >
                                        <IonIcon icon={pointsDifference > 0 ? trendingUp : trendingDown} />
                                        <span>
                      {pointsDifference > 0 ? "+" : ""}
                                            {pointsDifference} puntos de diferencia
                    </span>
                                    </div>
                                )}

                                {/* NUEVA FUNCIONALIDAD: Alerta de diferencia excesiva */}
                                {isPointsDifferenceExcessive && (
                                    <div className="points-warning">
                                        <IonIcon icon={warningOutline} />
                                        <div className="warning-text">
                                            <strong>Diferencia de puntos excesiva</strong>
                                            <p>
                                                La diferencia de {absolutePointsDifference} puntos supera el límite de 200 puntos permitido para
                                                intercambios.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Productos del trader */}
                            <div className="trade-section">
                                <div className="section-header">
                                    <h4>{traderNickname} ofrece</h4>
                                    <div className="products-count">
                                        {traderProducts.length} producto{traderProducts.length !== 1 ? "s" : ""}
                                    </div>
                                </div>
                                <div className="products-grid">
                                    {traderProducts.length > 0 ? (
                                        traderProducts.map((product, index) => (
                                            <div key={product.id} className="product-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                                <ProductMessage product={product} />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-products">
                                            <p>No hay productos seleccionados</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Productos del non-trader */}
                            <div className="trade-section">
                                <div className="section-header">
                                    <h4>{nonTraderNickname} ofrece</h4>
                                    <div className="products-count">
                                        {nonTraderProducts.length} producto{nonTraderProducts.length !== 1 ? "s" : ""}
                                    </div>
                                </div>
                                <div className="products-grid">
                                    {nonTraderProducts.length > 0 ? (
                                        nonTraderProducts.map((product, index) => (
                                            <div key={product.id} className="product-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                                <ProductMessage product={product} />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-products">
                                            <p>No hay productos seleccionados</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mensaje de confirmación */}
                            <div className="confirmation-card">
                                <div className="confirmation-icon">{currentUserIsTrader ? "👑" : "⏳"}</div>
                                <div className="confirmation-text">
                                    {currentUserIsTrader ? (
                                        <>
                                            <h5>¡Listo para confirmar!</h5>
                                            <p>Como dueño del producto del chat, puedes confirmar este intercambio.</p>
                                            {isPointsDifferenceExcessive && (
                                                <p className="warning-text">
                                                    ⚠️ No se puede confirmar debido a la diferencia excesiva de puntos.
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <h5>Esperando confirmación</h5>
                                            <p>El dueño del producto debe confirmar el intercambio.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con botones modernos */}
                <div className="trade-modal-footer">
                    <button className="cancel-button" onClick={onClose} disabled={confirming}>
                        Cancelar
                    </button>
                    {currentUserIsTrader && (
                        <button
                            className={`confirm-button ${!canConfirmTrade ? "disabled" : ""}`}
                            onClick={handleConfirmTrade}
                            disabled={!canConfirmTrade || confirming}
                            title={
                                isPointsDifferenceExcessive
                                    ? "No se puede confirmar: diferencia de puntos excesiva"
                                    : "Confirmar intercambio"
                            }
                        >
                            <div className="button-content">
                                <IonIcon icon={isPointsDifferenceExcessive ? warningOutline : checkmarkCircle} />
                                <span>
                  {confirming
                      ? "Confirmando..."
                      : isPointsDifferenceExcessive
                          ? "Diferencia excesiva"
                          : "Confirmar Intercambio"}
                </span>
                            </div>
                            {confirming && <div className="button-loading"></div>}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
        /* Variables heredadas del sistema de diseño */
        .trade-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
          padding: 20px;
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .trade-modal-container {
          background: var(--card-background, #ffffff);
          border-radius: 20px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--card-shadow, 0 20px 40px rgba(0, 0, 0, 0.1));
          border: 1px solid var(--border-color, #e4e7f2);
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Header moderno con gradiente */
        .trade-modal-header {
          background: var(--gradient-primary, linear-gradient(135deg, #4a80e4, #5c8fee));
          color: white;
          padding: 24px 28px;
          position: relative;
          overflow: hidden;
        }

        .trade-modal-header::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(45deg);
          animation: headerShine 3s infinite;
        }

        @keyframes headerShine {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          25%,
          100% {
            transform: translateX(100%) rotate(45deg);
          }
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 2;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .header-text h3 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .product-chat-name {
          margin: 4px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }

        .trade-modal-close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 3;
        }

        .trade-modal-close-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        /* Contenido principal */
        .trade-modal-content {
          padding: 28px;
          overflow-y: auto;
          flex: 1;
          background: var(--background-color, #f8f9fc);
        }

        .trade-modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .trade-modal-content::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb, rgba(74, 128, 228, 0.2));
          border-radius: 3px;
        }

        .trade-modal-content::-webkit-scrollbar-track {
          background: var(--scrollbar-track, rgba(74, 128, 228, 0.05));
        }

        /* Estados de carga y error mejorados */
        .trade-modal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .loading-spinner {
          position: relative;
          width: 60px;
          height: 60px;
          margin-bottom: 24px;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top: 3px solid var(--accent-color, #4a80e4);
          border-radius: 50%;
          animation: spin 1.2s linear infinite;
        }

        .spinner-ring:nth-child(2) {
          animation-delay: -0.4s;
          border-top-color: rgba(74, 128, 228, 0.6);
        }

        .spinner-ring:nth-child(3) {
          animation-delay: -0.8s;
          border-top-color: rgba(74, 128, 228, 0.3);
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .trade-modal-loading p {
          color: var(--text-secondary, #606478);
          font-size: 16px;
          font-weight: 500;
        }

        .trade-modal-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .retry-button {
          background: var(--gradient-primary, linear-gradient(135deg, #4a80e4, #5c8fee));
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--button-shadow, 0 8px 16px rgba(74, 128, 228, 0.25));
        }

        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(74, 128, 228, 0.35);
        }

        /* Resumen principal */
        .trade-summary {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Card de resumen de puntos destacado */
        .points-summary-card {
          background: var(--card-background, #ffffff);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--card-shadow, 0 10px 25px rgba(0, 0, 0, 0.06));
          border: 1px solid var(--border-color, #e4e7f2);
          position: relative;
          overflow: hidden;
        }

        .points-summary-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--gradient-primary, linear-gradient(135deg, #4a80e4, #5c8fee));
        }

        .points-comparison {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .user-points {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          background: var(--gradient-primary, linear-gradient(135deg, #4a80e4, #5c8fee));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 18px;
          box-shadow: var(--button-shadow, 0 8px 16px rgba(74, 128, 228, 0.25));
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-color, #1a1c2a);
        }

        .points-value {
          font-size: 24px;
          font-weight: 800;
          color: var(--accent-color, #4a80e4);
          text-align: center;
        }

        .vs-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 20px;
        }

        .exchange-icon {
          width: 40px;
          height: 40px;
          background: var(--searchbar-bg, #f0f2f8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: var(--accent-color, #4a80e4);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .points-difference {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .points-difference.positive {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .points-difference.negative {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        /* NUEVA FUNCIONALIDAD: Estilos para diferencia excesiva */
        .points-difference.excessive {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
          border: 2px solid rgba(239, 68, 68, 0.3);
          animation: warningPulse 2s infinite;
        }

        @keyframes warningPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
        }

        /* NUEVA FUNCIONALIDAD: Alerta de diferencia excesiva */
        .points-warning {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #dc2626;
          margin-top: 16px;
        }

        .points-warning ion-icon {
          font-size: 24px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-text strong {
          display: block;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .warning-text p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }

        /* Secciones de productos */
        .trade-section {
          background: var(--card-background, #ffffff);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--card-shadow, 0 10px 25px rgba(0, 0, 0, 0.06));
          border: 1px solid var(--border-color, #e4e7f2);
          animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color, #e4e7f2);
        }

        .section-header h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-color, #1a1c2a);
          letter-spacing: -0.01em;
        }

        .products-count {
          background: var(--searchbar-bg, #f0f2f8);
          color: var(--text-secondary, #606478);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .product-card {
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .no-products {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary, #606478);
          font-style: italic;
          background: var(--searchbar-bg, #f0f2f8);
          border-radius: 12px;
          border: 2px dashed var(--border-color, #e4e7f2);
        }

        /* Card de confirmación */
        .confirmation-card {
          background: var(--card-background, #ffffff);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: var(--card-shadow, 0 10px 25px rgba(0, 0, 0, 0.06));
          border: 1px solid var(--border-color, #e4e7f2);
          position: relative;
          overflow: hidden;
        }

        .confirmation-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #22c55e, #16a34a);
        }

        .confirmation-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .confirmation-text h5 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-color, #1a1c2a);
        }

        .confirmation-text p {
          margin: 0;
          font-size: 14px;
          color: var(--text-secondary, #606478);
          line-height: 1.5;
        }

        .confirmation-text .warning-text {
          color: #dc2626;
          font-weight: 600;
          margin-top: 8px;
        }

        /* Footer moderno */
        .trade-modal-footer {
          padding: 24px 28px;
          background: var(--card-background, #ffffff);
          border-top: 1px solid var(--border-color, #e4e7f2);
          display: flex;
          justify-content: flex-end;
          gap: 16px;
        }

        .cancel-button,
        .confirm-button {
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          position: relative;
          overflow: hidden;
        }

        .cancel-button {
          background: var(--searchbar-bg, #f0f2f8);
          color: var(--text-color, #1a1c2a);
          border: 1px solid var(--border-color, #e4e7f2);
        }

        .cancel-button:hover:not(:disabled) {
          background: var(--hover-bg, rgba(74, 128, 228, 0.08));
          transform: translateY(-2px);
        }

        .confirm-button {
          background: var(--gradient-primary, linear-gradient(135deg, #4a80e4, #5c8fee));
          color: white;
          min-width: 180px;
          box-shadow: var(--button-shadow, 0 8px 16px rgba(74, 128, 228, 0.25));
          position: relative;
        }

        .confirm-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(74, 128, 228, 0.35);
        }

        .confirm-button:disabled,
        .confirm-button.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          background: #9ca3af;
          box-shadow: none;
        }

        .confirm-button.disabled {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          z-index: 2;
        }

        .button-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: buttonLoading 1.5s infinite;
        }

        @keyframes buttonLoading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .trade-modal-container {
            max-width: 95vw;
            max-height: 95vh;
            border-radius: 16px;
          }

          .trade-modal-header {
            padding: 20px 24px;
          }

          .trade-modal-content {
            padding: 20px;
          }

          .trade-modal-footer {
            padding: 20px 24px;
            flex-direction: column;
          }

          .cancel-button,
          .confirm-button {
            width: 100%;
            justify-content: center;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }

          .points-comparison {
            flex-direction: column;
            gap: 20px;
          }

          .vs-divider {
            margin: 0;
            transform: rotate(90deg);
          }

          .header-text h3 {
            font-size: 20px;
          }

          .points-value {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .trade-modal-overlay {
            padding: 10px;
          }

          .trade-modal-header {
            padding: 16px 20px;
          }

          .trade-modal-content {
            padding: 16px;
          }

          .trade-modal-footer {
            padding: 16px 20px;
          }

          .header-content {
            gap: 12px;
          }

          .header-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .confirmation-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
        </div>
    )
}

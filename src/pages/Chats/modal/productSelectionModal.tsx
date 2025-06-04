"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { IonIcon } from "@ionic/react"
import { close, checkmarkCircle } from "ionicons/icons"
import { ProductService, type Product } from "../../../Services/ProductService"
import cloudinaryImage from "../../../Services/CloudinaryService"

interface ProductSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onProductsSelected: (products: Product[]) => void
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
                                                                                isOpen,
                                                                                onClose,
                                                                                onProductsSelected,
                                                                            }) => {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoading(true)
                setError(null)

                // Get user's products using the new method
                const userProducts = await ProductService.getUserProducts()
                setProducts(userProducts)
            } catch (error) {
                console.error("Error loading products:", error)
                setError("No se pudieron cargar los productos. Inténtalo de nuevo.")
            } finally {
                setLoading(false)
            }
        }

        if (isOpen) {
            loadProducts()
        } else {
            // Clear selections when modal closes
            setSelectedProducts(new Set())
        }
    }, [isOpen])

    const toggleProductSelection = (productId: string) => {
        const newSelection = new Set(selectedProducts)
        if (newSelection.has(productId)) {
            newSelection.delete(productId)
        } else {
            newSelection.add(productId)
        }
        setSelectedProducts(newSelection)
    }

    const handleAccept = () => {
        const selectedProductsList = products.filter((product) => selectedProducts.has(product.id))
        onProductsSelected(selectedProductsList)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="product-modal-overlay">
            <div className="product-modal-container">
                <div className="product-modal-header">
                    <h3>Seleccionar productos</h3>
                    <button className="product-modal-close-button" onClick={onClose}>
                        <IonIcon icon={close} />
                    </button>
                </div>

                <div className="product-modal-content">
                    {loading ? (
                        <div className="product-modal-loading">
                            <div className="product-modal-spinner"></div>
                            <p>Cargando productos...</p>
                        </div>
                    ) : error ? (
                        <div className="product-modal-error">
                            <p>{error}</p>
                            <button onClick={() => setError(null)}>Reintentar</button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="product-modal-no-products">
                            <p>No tienes productos disponibles para compartir.</p>
                        </div>
                    ) : (
                        <div className="product-modal-grid">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className={`product-modal-item ${selectedProducts.has(product.id) ? "selected" : ""}`}
                                    onClick={() => toggleProductSelection(product.id)}
                                >
                                    <div className="product-modal-image-container">
                                        <img
                                            src={
                                                product.imagenes && product.imagenes.length > 0
                                                    ? product.imagenes[0]
                                                    : "/placeholder.svg?height=120&width=120"
                                            }
                                            alt={product.name}
                                            className="product-modal-image"
                                        />
                                        {selectedProducts.has(product.id) && (
                                            <div className="product-modal-selection-indicator">
                                                <IonIcon icon={checkmarkCircle} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="product-modal-details">
                                        <h4 className="product-modal-name">{product.name}</h4>
                                        <p className="product-modal-points">{product.points} puntos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="product-modal-footer">
                    <button className="product-modal-cancel-button" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="product-modal-accept-button" onClick={handleAccept} disabled={selectedProducts.size === 0}>
                        Aceptar ({selectedProducts.size})
                    </button>
                </div>
            </div>

            <style>{`
        .product-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .product-modal-container {
          background-color: var(--ion-background-color, #ffffff);
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .product-modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--ion-border-color, #d7d8da);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--ion-background-color, #ffffff);
        }
        
        .product-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--ion-text-color, #000000);
        }
        
        .product-modal-close-button {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          color: var(--ion-text-color, #000000);
          border-radius: 50%;
          width: 32px;
          height: 32px;
        }
        
        .product-modal-close-button:hover {
          background-color: var(--ion-color-light, #f4f5f8);
        }
        
        .product-modal-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        
        .product-modal-loading, 
        .product-modal-error, 
        .product-modal-no-products {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: var(--ion-text-color, #000000);
        }
        
        .product-modal-spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 3px solid var(--ion-color-primary, #3880ff);
          width: 32px;
          height: 32px;
          animation: product-modal-spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes product-modal-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .product-modal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
          padding: 0;
        }
        
        @media (max-width: 480px) {
          .product-modal-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }
        }
        
        .product-modal-item {
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid var(--ion-border-color, #d7d8da);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          background-color: var(--ion-card-background, #ffffff);
          display: flex;
          flex-direction: column;
          height: 200px;
        }
        
        .product-modal-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .product-modal-item.selected {
          border-color: var(--ion-color-primary, #3880ff);
          box-shadow: 0 0 0 2px rgba(56, 128, 255, 0.2);
        }
        
        .product-modal-image-container {
          position: relative;
          width: 100%;
          height: 120px;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .product-modal-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .product-modal-selection-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          background-color: var(--ion-color-primary, #3880ff);
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .product-modal-details {
          padding: 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .product-modal-name {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.3;
          color: var(--ion-text-color, #000000);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .product-modal-points {
          margin: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--ion-color-primary, #3880ff);
        }
        
        .product-modal-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--ion-border-color, #d7d8da);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background-color: var(--ion-background-color, #ffffff);
        }
        
        .product-modal-cancel-button, 
        .product-modal-accept-button {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          border: none;
        }
        
        .product-modal-cancel-button {
          background-color: transparent;
          border: 1px solid var(--ion-border-color, #d7d8da);
          color: var(--ion-text-color, #000000);
        }
        
        .product-modal-cancel-button:hover {
          background-color: var(--ion-color-light, #f4f5f8);
        }
        
        .product-modal-accept-button {
          background-color: var(--ion-color-primary, #3880ff);
          color: white;
          min-width: 100px;
        }
        
        .product-modal-accept-button:hover:not(:disabled) {
          background-color: var(--ion-color-primary-shade, #3171e0);
        }
        
        .product-modal-accept-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .product-modal-error button {
          margin-top: 16px;
          padding: 8px 16px;
          background-color: var(--ion-color-primary, #3880ff);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
        </div>
    )
}
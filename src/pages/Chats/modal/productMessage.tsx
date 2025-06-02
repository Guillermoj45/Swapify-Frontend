"use client"

import type React from "react"

import type { Product } from "../../../Services/ProductService"
import cloudinaryImage from "../../../Services/CloudinaryService"

interface ProductMessageProps {
    product: Product
}

export const ProductMessage: React.FC<ProductMessageProps> = ({ product }) => {
    return (
        <div className="product-message-container">
            <div className="product-message-card">
                <div className="product-message-image">
                    <img
                        src={
                            product.imagenes && product.imagenes.length > 0
                                ? product.imagenes[0]
                                : ""
                        }
                        alt={product.name}
                    />
                </div>
                <div className="product-message-info">
                    <h4 className="product-message-title">{product.name}</h4>
                    <p className="product-message-description">{product.description}</p>
                    <p className="product-message-points">{product.points} puntos</p>
                </div>
            </div>

            <style>{`
        .product-message-container {
          width: 100%;
          margin: 4px 0;
          max-width: 300px;
        }
        
        .product-message-card {
          display: flex;
          background-color: var(--ion-card-background, #ffffff);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--ion-border-color, #d7d8da);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s ease;
        }
        
        .product-message-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .product-message-image {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          overflow: hidden;
        }
        
        .product-message-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .product-message-info {
          padding: 12px;
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .product-message-title {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--ion-text-color, #000000);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .product-message-description {
          margin: 0 0 6px 0;
          font-size: 12px;
          color: var(--ion-color-medium, #92949c);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .product-message-points {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--ion-color-primary, #3880ff);
        }
      `}</style>
        </div>
    )
}

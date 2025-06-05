"use client"

import { useState, useCallback } from "react"
import type { TradeOffer, TradeState, TradeSelectionMessage, TradeoDTO } from "../types/TradeTypes"
import type { Product } from "../Services/ProductService"
import { TradeService } from "../Services/TradeService"

interface UseTradeSystemProps {
    chatId: string;
    currentUserId: string;
    isCurrentUserProductOwner: boolean;
    productDelChat: string;
    onRefreshChats: () => Promise<void>;
    onTradeConfirmed: (tradeOffer: any) => Promise<void>;
    onModalsClose: () => void;
}

export const useTradeSystem = ({
                                   chatId,
                                   currentUserId,
                                   isCurrentUserProductOwner,
                                   productDelChat,
                                   onTradeConfirmed,
                               }: UseTradeSystemProps) => {
    const [tradeState, setTradeState] = useState<TradeState>({
        currentOffer: null,
        isTradeModalOpen: false,
        userRole: isCurrentUserProductOwner ? "trader" : "non_trader",
    })

    // CORREGIDO: Estructura más clara para las selecciones
    const [temporarySelections, setTemporarySelections] = useState<{
        productOwnerProducts: string[] // Productos del dueño del producto del chat
        otherUserProducts: string[] // Productos del otro usuario
        productOwnerUserId: string | null // ID del dueño del producto
        otherUserId: string | null // ID del otro usuario
    }>({
        productOwnerProducts: [],
        otherUserProducts: [],
        productOwnerUserId: null,
        otherUserId: null,
    })

    // CORREGIDO: Manejar selección de productos con lógica simplificada
    const handleProductsSelected = useCallback(
        (products: Product[]): TradeSelectionMessage => {
            const productIds = products.map((p) => p.id)

            console.log(`📦 Usuario actual seleccionó productos:`, {
                userId: currentUserId,
                isProductOwner: isCurrentUserProductOwner,
                productIds,
            })

            // Actualizar selecciones basado en si es dueño del producto o no
            setTemporarySelections((prev) => {
                if (isCurrentUserProductOwner) {
                    return {
                        ...prev,
                        productOwnerProducts: productIds,
                        productOwnerUserId: currentUserId,
                    }
                } else {
                    return {
                        ...prev,
                        otherUserProducts: productIds,
                        otherUserId: currentUserId,
                    }
                }
            })

            // Crear mensaje de selección
            const tradeMessage: TradeSelectionMessage = {
                type: "trade_selection",
                userRole: isCurrentUserProductOwner ? "trader" : "non_trader",
                productIds,
                userId: currentUserId,
                chatId,
                productDelChat,
            }

            return tradeMessage
        },
        [isCurrentUserProductOwner, currentUserId, chatId, productDelChat],
    )

    // CORREGIDO: Procesar mensaje de selección con lógica mejorada
    const processTradeMessage = useCallback(
        (messageContent: string): boolean => {
            try {
                const tradeData = JSON.parse(messageContent)

                if (tradeData.type === "trade_selection") {
                    // Ignorar mensajes propios
                    if (tradeData.userId === currentUserId) {
                        console.log("⚠️ Ignorando mensaje de intercambio propio")
                        return true
                    }

                    console.log("📨 Procesando selección del otro usuario:", tradeData)

                    // Determinar si el remitente es el dueño del producto
                    const senderIsProductOwner = tradeData.userRole === "trader"

                    setTemporarySelections((prev) => {
                        const newSelections = { ...prev }

                        if (senderIsProductOwner) {
                            // El remitente es el dueño del producto
                            newSelections.productOwnerProducts = tradeData.productIds
                            newSelections.productOwnerUserId = tradeData.userId
                        } else {
                            // El remitente NO es el dueño del producto
                            newSelections.otherUserProducts = tradeData.productIds
                            newSelections.otherUserId = tradeData.userId
                        }

                        console.log("📦 Selecciones actualizadas:", newSelections)

                        // Verificar si ambos usuarios han seleccionado productos
                        const bothUsersReady =
                            newSelections.productOwnerProducts.length > 0 && newSelections.otherUserProducts.length > 0

                        if (bothUsersReady) {
                            console.log("✅ Ambos usuarios han seleccionado productos")

                            // Crear oferta de intercambio con datos correctos
                            const tradeOffer: TradeOffer = {
                                id: `trade-${chatId}-${Date.now()}`,
                                chatId,
                                productDelChat,
                                traderProducts: newSelections.productOwnerProducts,
                                nonTraderProducts: newSelections.otherUserProducts,
                                traderUserId: newSelections.productOwnerUserId || "",
                                nonTraderUserId: newSelections.otherUserId || "",
                                acceptedByProfile1: false,
                                acceptedByProfile2: false,
                                completed: false,
                                status: "both_ready",
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }

                            console.log("🎯 Oferta de intercambio creada:", tradeOffer)

                            setTradeState((prev) => ({
                                ...prev,
                                currentOffer: tradeOffer,
                                // Solo mostrar modal al dueño del producto (trader)
                                isTradeModalOpen: isCurrentUserProductOwner,
                            }))
                        }

                        return newSelections
                    })

                    return true
                }
            } catch (error) {
                console.error("Error al procesar mensaje de intercambio:", error)
                return false
            }

            return false
        },
        [chatId, isCurrentUserProductOwner, currentUserId, productDelChat],
    )

    // CORREGIDO: Confirmar intercambio con validaciones mejoradas y cierre de modales
    const confirmTrade = useCallback(async () => {
        if (!tradeState.currentOffer || !isCurrentUserProductOwner) {
            console.warn("No se puede confirmar: no hay oferta o el usuario no es el dueño del producto")
            return
        }

        try {
            console.log("🚀 Confirmando intercambio:", tradeState.currentOffer)

            // Preparar el DTO para el backend
            const tradeoDTO: TradeoDTO = {
                productUserTrader: tradeState.currentOffer.traderProducts,
                usuarioTrader: tradeState.currentOffer.traderUserId,
                productDelChat: tradeState.currentOffer.productDelChat,
                productsUserNotTrader: tradeState.currentOffer.nonTraderProducts,
                usuarioNotTrader: tradeState.currentOffer.nonTraderUserId,
            }

            console.log("📡 Enviando al backend:", tradeoDTO)

            // Enviar al backend
            await TradeService.createTrade(tradeoDTO)

            // Actualizar estado local
            const confirmedOffer: TradeOffer = {
                ...tradeState.currentOffer,
                acceptedByProfile1: true,
                status: "confirmed",
                updatedAt: new Date(),
            }

            // NUEVO: Cerrar modal inmediatamente
            setTradeState((prev) => ({
                ...prev,
                currentOffer: confirmedOffer,
                isTradeModalOpen: false,
            }))

            // Limpiar selecciones
            setTemporarySelections({
                productOwnerProducts: [],
                otherUserProducts: [],
                productOwnerUserId: null,
                otherUserId: null,
            })

            // Notificar al componente padre
            onTradeConfirmed(confirmedOffer)

            console.log("✅ Intercambio confirmado exitosamente")
        } catch (error) {
            console.error("❌ Error al confirmar intercambio:", error)
            throw error
        }
    }, [tradeState.currentOffer, isCurrentUserProductOwner, onTradeConfirmed])

    // Cerrar modal de intercambio
    const closeTradeSummary = useCallback(() => {
        setTradeState((prev) => ({
            ...prev,
            isTradeModalOpen: false,
        }))
    }, [])

    // Cancelar intercambio actual
    const cancelTrade = useCallback(() => {
        setTradeState({
            currentOffer: null,
            isTradeModalOpen: false,
            userRole: isCurrentUserProductOwner ? "trader" : "non_trader",
        })
        setTemporarySelections({
            productOwnerProducts: [],
            otherUserProducts: [],
            productOwnerUserId: null,
            otherUserId: null,
        })
    }, [isCurrentUserProductOwner])

    return {
        tradeState,
        temporarySelections,
        handleProductsSelected,
        processTradeMessage,
        confirmTrade,
        closeTradeSummary,
        cancelTrade,
    }
}

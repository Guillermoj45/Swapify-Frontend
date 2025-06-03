"use client"

import { useState, useCallback } from "react"
import type { TradeOffer, TradeState, TradeSelectionMessage, TradeoDTO } from "../types/TradeTypes"
import type { Product } from "../Services/ProductService"
import { TradeService } from "../Services/TradeService"

interface UseTradeSystemProps {
    chatId: string
    currentUserId: string
    isCurrentUserProductOwner: boolean
    productDelChat: string // ID del producto principal del chat
    onTradeConfirmed: (tradeOffer: TradeOffer) => void
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

    const [temporarySelections, setTemporarySelections] = useState<{
        trader: string[]
        non_trader: string[]
    }>({
        trader: [],
        non_trader: [],
    })

    // Manejar selección de productos por el usuario actual
    const handleProductsSelected = useCallback(
        (products: Product[]): TradeSelectionMessage => {
            const productIds = products.map((p) => p.id)

            // Determinar el rol correcto basado en si es dueño del producto
            const userRole = isCurrentUserProductOwner ? "trader" : "non_trader"

            setTemporarySelections((prev) => ({
                ...prev,
                [userRole]: productIds,
            }))

            console.log(`📦 Usuario ${userRole} seleccionó productos:`, productIds)

            // Crear mensaje especial indicando que el usuario ha seleccionado productos
            const tradeMessage: TradeSelectionMessage = {
                type: "trade_selection",
                userRole,
                productIds,
                userId: currentUserId,
                chatId,
                productDelChat,
            }

            return tradeMessage
        },
        [isCurrentUserProductOwner, currentUserId, chatId, productDelChat],
    )

    // Procesar mensaje de selección de productos recibido
    const processTradeMessage = useCallback(
        (messageContent: string): boolean => {
            try {
                const tradeData = JSON.parse(messageContent)

                if (tradeData.type === "trade_selection") {
                    // Determinar el rol del usuario que envió el mensaje
                    const senderRole = tradeData.userRole

                    // Si el mensaje es del usuario actual, ignorarlo
                    if (tradeData.userId === currentUserId) {
                        console.log("⚠️ Ignorando mensaje de intercambio propio")
                        return true
                    }

                    // Actualizar las selecciones temporales con los productos del otro usuario
                    setTemporarySelections((prev) => {
                        const newSelections = {
                            ...prev,
                            [senderRole]: tradeData.productIds,
                        }

                        console.log("📦 Selecciones actualizadas:", newSelections)

                        // Verificar si ambos usuarios han seleccionado productos
                        if (newSelections.trader.length > 0 && newSelections.non_trader.length > 0) {
                            console.log("✅ Ambos usuarios han seleccionado productos")

                            // Crear oferta de intercambio
                            const tradeOffer: TradeOffer = {
                                id: `trade-${chatId}-${Date.now()}`,
                                chatId,
                                productDelChat,
                                traderProducts: newSelections.trader,
                                nonTraderProducts: newSelections.non_trader,
                                traderUserId: isCurrentUserProductOwner ? currentUserId : tradeData.userId,
                                nonTraderUserId: isCurrentUserProductOwner ? tradeData.userId : currentUserId,
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
                                isTradeModalOpen: isCurrentUserProductOwner, // Solo mostrar al trader (dueño del producto)
                            }))
                        }

                        return newSelections
                    })

                    return true // Indica que el mensaje fue procesado como mensaje de intercambio
                }
            } catch (error) {
                console.error("Error al procesar mensaje de intercambio:", error)
                return false
            }

            return false
        },
        [chatId, isCurrentUserProductOwner, currentUserId, productDelChat],
    )

    // Confirmar intercambio (solo para el trader - dueño del producto)
    const confirmTrade = useCallback(async () => {
        if (!tradeState.currentOffer || !isCurrentUserProductOwner) {
            console.warn("No se puede confirmar: no hay oferta o el usuario no es el dueño del producto")
            return
        }

        try {
            // Preparar el DTO para el backend
            const tradeoDTO: TradeoDTO = {
                productUserTrader: tradeState.currentOffer.traderProducts,
                usuarioTrader: tradeState.currentOffer.traderUserId,
                productDelChat: tradeState.currentOffer.productDelChat,
                productsUserNotTrader: tradeState.currentOffer.nonTraderProducts,
                usuarioNotTrader: tradeState.currentOffer.nonTraderUserId,
            }

            console.log("🚀 Enviando intercambio al backend:", tradeoDTO)

            // Enviar al backend
            await TradeService.createTrade(tradeoDTO)

            // Actualizar el estado local
            const confirmedOffer: TradeOffer = {
                ...tradeState.currentOffer,
                acceptedByProfile1: true, // El trader confirma
                status: "confirmed",
                updatedAt: new Date(),
            }

            setTradeState((prev) => ({
                ...prev,
                currentOffer: confirmedOffer,
                isTradeModalOpen: false,
            }))

            // Limpiar selecciones temporales
            setTemporarySelections({ trader: [], non_trader: [] })

            // Notificar al componente padre
            onTradeConfirmed(confirmedOffer)

            console.log("✅ Intercambio confirmado exitosamente")
        } catch (error) {
            console.error("❌ Error al confirmar intercambio:", error)
            throw error // Re-lanzar para que el componente padre pueda manejarlo
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
        setTemporarySelections({ trader: [], non_trader: [] })
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

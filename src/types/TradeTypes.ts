export interface TradeoDTO {
    // Productos del usuario que tiene el producto del chat (trader)
    productUserTrader: string[]
    usuarioTrader: string
    productDelChat: string

    // Productos del usuario que no tiene el producto del chat
    productsUserNotTrader: string[]
    usuarioNotTrader: string
}

export interface TradeOffer {
    id: string
    chatId: string
    productDelChat: string // Producto principal del chat
    traderProducts: string[] // Productos del usuario trader (dueño del producto del chat)
    nonTraderProducts: string[] // Productos del usuario no-trader
    traderUserId: string // ID del usuario trader
    nonTraderUserId: string // ID del usuario no-trader
    acceptedByProfile1: boolean
    acceptedByProfile2: boolean
    completed: boolean
    status: "pending" | "trader_ready" | "non_trader_ready" | "both_ready" | "confirmed" | "cancelled"
    createdAt: Date
    updatedAt: Date
}

export interface TradeState {
    currentOffer: TradeOffer | null
    isTradeModalOpen: boolean
    userRole: "trader" | "non_trader" | null
}

export interface TradeSelectionMessage {
    type: "trade_selection"
    userRole: "trader" | "non_trader"
    productIds: string[]
    userId: string
    chatId: string
    productDelChat: string
}

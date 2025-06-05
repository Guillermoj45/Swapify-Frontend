"use client"

import type { TradeoDTO, TradeOffer } from "../types/TradeTypes"
import API from "./api"

export class TradeService {
    static async createTrade(tradeoDTO: TradeoDTO): Promise<void> {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")

        if (!token) {
            throw new Error("No se encontró token de autenticación")
        }

        console.log("🚀 Enviando intercambio al backend:", tradeoDTO)

        try {
            const response = await API.post("/trade", tradeoDTO, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            console.log("📡 Respuesta del backend:", response.status, response.statusText)
            console.log("✅ Intercambio creado exitosamente en el backend")
        } catch (error: any) {
            console.error("❌ Error al crear el intercambio:", error)

            if (error.response) {
                const { status, data } = error.response

                if (status === 401) {
                    throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.")
                } else if (status === 400) {
                    throw new Error("Datos de intercambio inválidos. Verifica los productos seleccionados.")
                } else if (status === 403) {
                    throw new Error("No tienes permisos para realizar este intercambio.")
                } else {
                    throw new Error(`Error al crear el intercambio: ${data || "Error desconocido"}`)
                }
            } else {
                throw new Error("Error de red o inesperado al crear el intercambio")
            }
        }
    }

    static async getTradeHistory(userId: string): Promise<TradeOffer[]> {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")

        if (!token) {
            throw new Error("No se encontró token de autenticación")
        }

        try {
            const response = await API.get(`/trades/history/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            return response.data
        } catch (error: any) {
            console.error("❌ Error al obtener el historial de intercambios:", error)
            throw new Error("Error al obtener el historial de intercambios")
        }
    }
}

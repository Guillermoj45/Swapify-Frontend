"use client"

import type { TradeoDTO, TradeOffer } from "../types/TradeTypes"
import API from "./api"

export class TradeService {
    private static baseUrl = API

    static async createTrade(tradeoDTO: TradeoDTO): Promise<void> {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")

        if (!token) {
            throw new Error("No se encontró token de autenticación")
        }

        console.log("🚀 Enviando intercambio al backend:", tradeoDTO)

        const response = await fetch(`${this.baseUrl}/trade`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(tradeoDTO),
        })

        console.log("📡 Respuesta del backend:", {
            status: response.status,
            statusText: response.statusText,
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("❌ Error response:", errorText)

            if (response.status === 401) {
                throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.")
            } else if (response.status === 400) {
                throw new Error("Datos de intercambio inválidos. Verifica los productos seleccionados.")
            } else if (response.status === 403) {
                throw new Error("No tienes permisos para realizar este intercambio.")
            } else {
                throw new Error(`Error al crear el intercambio: ${errorText}`)
            }
        }

        // El backend no retorna nada en caso de éxito
        console.log("✅ Intercambio creado exitosamente en el backend")
    }

    static async getTradeHistory(userId: string): Promise<TradeOffer[]> {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")

        if (!token) {
            throw new Error("No se encontró token de autenticación")
        }

        // Nota: Este endpoint no está implementado en el backend proporcionado
        // Se puede implementar más tarde si es necesario
        const response = await fetch(`${this.baseUrl}/trades/history/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            throw new Error("Error al obtener el historial de intercambios")
        }

        return response.json()
    }
}

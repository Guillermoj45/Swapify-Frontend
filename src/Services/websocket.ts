/**import {Injectable} from '@angular/core';
import {Client} from '@stomp/stompjs';
import {BehaviorSubject, Observable} from 'rxjs';
import {ChatMessage} from '../Models/ChatMessage';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../environments/environment.prod";

@Injectable({
    providedIn: 'root',
})
export class WebsocketService {
    private stompClient!: Client;
    private messageSubject: BehaviorSubject<ChatMessage[]> = new BehaviorSubject<ChatMessage[]>([]); // Lista de mensajes


    constructor(private http: HttpClient) {}

    // Método para conectarse al WebSocket
    connect(roomId: string) {
        const webSocketUrl = environment.apiUrl + `/ws-native`; // URL del servidor WebSocket nativo
        this.stompClient = new Client({
            webSocketFactory: () => new WebSocket(webSocketUrl),
            reconnectDelay: 5000,
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log('Conectado al servidor WebSocket nativo');
                this.stompClient.subscribe(`/topic/messages/${roomId}`, (message) => {
                    try {
                        const chatMessage: ChatMessage = JSON.parse(message.body);
                        const currentMessages = this.messageSubject.getValue(); // Obtener los mensajes actuales
                        this.messageSubject.next([chatMessage]); // Emitir nuevos mensajes
                    } catch (error) {
                        console.error('Error al procesar el mensaje recibido:', error);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Error en WebSocket: ', frame.headers['message']);
            },
        });

        this.stompClient.activate();
    }

    newSubscription(roomId: string) {

    }

    // Método para enviar mensajes
    sendMessage(chatMessage: ChatMessage) {
        if (this.stompClient && this.stompClient.connected) {
            const message = JSON.stringify(chatMessage);
            this.stompClient.publish({
                destination: `/app/chat/${chatMessage.groupId}`,
                body: message,
            });
        } else {
            console.error('No se puede enviar el mensaje: WebSocket no está conectado.');
        }
    }

    // Obtener mensajes de un grupo
    getMessageObservable(): Observable<ChatMessage[]> {
        return this.messageSubject.asObservable();
    }

    // Obtener los detalles de un grupo
    getGroupDetails(groupId: number): Observable<any> {
        const url = environment.apiUrl + `/messages/grupos/${groupId}`; // Llamamos al endpoint que devuelve la información del grupo
        const token = sessionStorage.getItem('token'); // Obtén el token del almacenamiento de sesión
        const headers = { Authorization: `Bearer ${token}` }; // Incluye el token en los headers
        return this.http.get<any>(url, { headers }); // Llama al endpoint del backend
    }

    // Método para obtener los grupos del usuario
    getUserGroups(): Observable<any> {
        const url = environment.apiUrl + `/messages/info`; // URL del endpoint en el backend
        const token = sessionStorage.getItem('token');
        console.log('Token obtenido:', token); // Muestra el token en la consola
        const headers = { Authorization: `Bearer ${token}` }; // Añade el token del usuario
        return this.http.get<any>(url, { headers });
    }

    // Método para obtener los perfiles seguidos
    getFollowingProfiles(): Observable<any> {
        const url = environment.apiUrl + `/profile/following`; // URL del endpoint para obtener los perfiles seguidos
        const token = sessionStorage.getItem('token'); // Obtiene el token de la sessionStorage
        if (!token) {
            return new Observable(observer => {
                observer.error('Token no encontrado');
            });
        }
        console.log('Token obtenido:', token); // Muestra el token en la consola
        const headers = { Authorization: `Bearer ${token}` }; // Añade el token del usuario

        return this.http.get<any>(url, { headers }); // Llama al endpoint del backend
    }

    // Crear un nuevo grupo
    createGroup(groupName: { name: string }, file?: File | null): Observable<any> {
        const url = environment.apiUrl + '/messages/create';  // Endpoint del backend
        const token = sessionStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        const formData = new FormData();
        formData.append('group', JSON.stringify({ name: groupName.name }));
        if (file) {
            formData.append('file', file); // Solo agregar el archivo si está presente
        }

        return this.http.post<any>(url, formData, { headers });
    }

    // Añadir usuarios a un grupo
    addUsersToGroup(groupId: number, userIds: number[]): Observable<any> {
        const url = environment.apiUrl + `/messages/addUsersToGroup`; // Endpoint del backend
        const token = sessionStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        const params = { groupId }; // Solo enviamos el groupId como parámetro
        const body = userIds; // Lista de IDs de usuarios en el cuerpo de la solicitud

        return this.http.post<any>(url, body, { headers, params });
    }

    // Obtener mensajes por grupo
    getMessagesByGroup(groupId: number): Observable<ChatMessage[]> {
        const url = environment.apiUrl + `/messages/group/${groupId}`; // Endpoint del backend
        const token = sessionStorage.getItem('token'); // Obtiene el token de sesión
        const headers = { Authorization: `Bearer ${token}` }; // Incluye el token en los headers

        return this.http.get<ChatMessage[]>(url, { headers });
    }

    // Obtener los últimos mensajes de los grupos
    getUltimosMensajesPorGrupo(): Observable<any> {
        const url = environment.apiUrl + `/messages/grupos/ultimos-mensajes`; // Endpoint del backend
        const token = sessionStorage.getItem('token'); // Obtiene el token de sesión
        const headers = { Authorization: `Bearer ${token}` }; // Incluye el token en los headers
        return this.http.get<any>(url, { headers }); // Llama al endpoint del backend
    }

    // Desconectar el WebSocket
    disconnect() {
        if (this.stompClient && this.stompClient.active) {
            this.stompClient.deactivate();
            console.log('Conexión WebSocket cerrada.');
        }
    }
}
*/
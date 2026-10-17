import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { API_BASE } from '../api/client'

/**
 * Subscribes to a topic and calls onMessage for every push. Used two ways:
 *   - Resident subscribes to /topic/visitor/{flatNumber} to get the approve/reject popup
 *   - Guard subscribes to /topic/guard/{loginId} to see the resident's decision live
 * This is the actual "alerting" mechanism you asked for - no polling involved.
 */
export function useVisitorSocket(topic, onMessage) {
  const clientRef = useRef(null)

  useEffect(() => {
    if (!topic) return

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
      reconnectDelay: 4000,
      onConnect: () => {
        stompClient.subscribe(topic, (message) => {
          try {
            onMessage(JSON.parse(message.body))
          } catch {
            // ignore malformed frame
          }
        })
      }
    })

    stompClient.activate()
    clientRef.current = stompClient

    return () => {
      stompClient.deactivate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic])
}

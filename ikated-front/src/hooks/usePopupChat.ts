import { useState, useEffect, useRef } from 'react'

interface PopupChatState {
  popupWindow: Window | null
  isPopupOpen: boolean
  messages: any[]
}

export function usePopupChat() {
  const [popupState, setPopupState] = useState<PopupChatState>({
    popupWindow: null,
    isPopupOpen: false,
    messages: []
  })

  const messageHandlersRef = useRef<((event: MessageEvent) => void)[]>([])

  const openPopupChat = (initialMessages: any[] = []) => {
    if (popupState.popupWindow && !popupState.popupWindow.closed) {
      popupState.popupWindow.focus()
      return
    }

    const popupFeatures = [
      'width=1200',
      'height=800',
      'scrollbars=yes',
      'resizable=yes',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no'
    ].join(',')

    const popupUrl = `${window.location.origin}${window.location.pathname}?chat=popup`
    const popup = window.open(popupUrl, 'ikated-chat', popupFeatures)

    if (popup) {
      setPopupState({
        popupWindow: popup,
        isPopupOpen: true,
        messages: initialMessages
      })

      // Aguardar o popup carregar e enviar dados iniciais
      const checkPopupLoaded = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupLoaded)
          setPopupState(prev => ({
            ...prev,
            popupWindow: null,
            isPopupOpen: false
          }))
          return
        }

        try {
          // Tentar enviar mensagens iniciais
          popup.postMessage({
            type: 'INIT_MESSAGES',
            messages: initialMessages
          }, window.location.origin)
          clearInterval(checkPopupLoaded)
        } catch (error) {
          // Popup ainda não carregou completamente
        }
      }, 100)
    }
  }

  const closePopupChat = () => {
    if (popupState.popupWindow && !popupState.popupWindow.closed) {
      popupState.popupWindow.close()
    }
    setPopupState({
      popupWindow: null,
      isPopupOpen: false,
      messages: []
    })
  }

  const sendMessageToPopup = (message: any) => {
    if (popupState.popupWindow && !popupState.popupWindow.closed) {
      popupState.popupWindow.postMessage({
        type: 'NEW_MESSAGE',
        message
      }, window.location.origin)
    }
  }

  const addMessageHandler = (handler: (event: MessageEvent) => void) => {
    messageHandlersRef.current.push(handler)

    const wrappedHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      handler(event)
    }

    window.addEventListener('message', wrappedHandler)

    return () => {
      window.removeEventListener('message', wrappedHandler)
      const index = messageHandlersRef.current.indexOf(handler)
      if (index > -1) {
        messageHandlersRef.current.splice(index, 1)
      }
    }
  }

  // Detectar quando popup é fechado
  useEffect(() => {
    if (!popupState.popupWindow) return

    const checkClosed = setInterval(() => {
      if (popupState.popupWindow?.closed) {
        setPopupState(prev => ({
          ...prev,
          popupWindow: null,
          isPopupOpen: false
        }))
        clearInterval(checkClosed)
      }
    }, 1000)

    return () => clearInterval(checkClosed)
  }, [popupState.popupWindow])

  return {
    ...popupState,
    openPopupChat,
    closePopupChat,
    sendMessageToPopup,
    addMessageHandler
  }
}

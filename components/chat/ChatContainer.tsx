'use client';

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import logoUlls from "@/assets/logoulls.png";
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}
export const ChatContainer = () => {
  const {
    language
  } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  const resetConversation = () => {
    setMessages([]);
    setThreadId('');
    toast.success(language === 'ES' ? "Conversación reiniciada" : "Conversation reset");
  };
  const sendMessage = async (userMessage: string) => {
    setIsLoading(true);

    // Agregar mensaje del usuario
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage
    };
    setMessages(prev => [...prev, userMsg]);

    // Agregar mensaje del asistente con streaming
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isStreaming: true
    };
    setMessages(prev => [...prev, assistantMsg]);
    try {
      // Llamar al edge function para manejar la conversación
      const {
        data,
        error
      } = await supabase.functions.invoke('chat-assistant', {
        body: {
          message: userMessage,
          threadId: threadId,
          language: language
        }
      });
      if (error) {
        console.error('Error:', error);
        throw new Error(error.message || 'Error en la conversación');
      }
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }

      // Actualizar el mensaje final
      setMessages(prev => prev.map(msg => msg.id === assistantMsg.id ? {
        ...msg,
        content: data.response || 'Sin respuesta',
        isStreaming: false
      } : msg));
    } catch (error) {
      console.error('Error:', error);
      toast.error((language === 'ES' ? "Error al enviar mensaje: " : "Error sending message: ") + (error as Error).message);

      // Remover el mensaje del asistente en caso de error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMsg.id));
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="flex flex-col h-full min-h-0 bg-gradient-to-br from-background to-secondary/30">
      {/* Header oculto para seguridad - configuración no accesible desde UI */}

      {/* Messages */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full p-0" ref={scrollAreaRef}>
        {messages.length === 0 ? <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2 py-[75px]">
              <Image
                src={logoUlls}
                alt="Assistant Logo"
                width={64}
                height={64}
                className="w-16 h-16 mx-auto"
                priority
              />
              <h3 className="text-lg font-medium">
                {language === 'ES' ? '¡Hola! Soy tu asistente' : 'Hello! I\'m your assistant'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'ES' ? 'Envíame un mensaje para comenzar' : 'Send me a message to get started'}
              </p>
            </div>
          </div> : <div className="space-y-0">
            {messages.map(message => <ChatMessage key={message.id} role={message.role} content={message.content} isStreaming={message.isStreaming} />)}
          </div>}
        </ScrollArea>
      </div>

      {/* Input - Fixed at bottom */}
      <div className="flex-shrink-0">
        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>;
};

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import logoull from "@/assets/logoulls.png";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const formatMessageContent = (content: string) => {
  // Limpiar referencias de documentación del tipo 【6:2†Activida_Trekking (1).pdf】
  const cleanContent = content.replace(/【[^】]*】/g, '');
  
  // Detectar URLs y convertirlas en enlaces clickables
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  return cleanContent.split('\n').map((line, lineIndex) => {
    const parts = line.split(urlRegex);
    
    return (
      <div key={lineIndex} className="mb-1">
        {parts.map((part, partIndex) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={partIndex}
                href={part}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-blue-500 hover:text-blue-600 underline transition-colors"
               title={"Ver detalles"}>
                Ver detalles
              </a>
            );
          }
          
          // Formatear texto con énfasis
          let formattedPart = part;
          
          // Convertir texto entre ** a negrita
          formattedPart = formattedPart.replace(
            /\*\*(.*?)\*\*/g,
            '<strong>$1</strong>'
          );
          
          // Resaltar precios (Desde X €)
          formattedPart = formattedPart.replace(
            /(Desde\s+[\d,.]+ €)/g,
            '<span class="font-semibold text-green-600">$1</span>'
          );
          
          // Resaltar títulos de viajes (líneas que empiezan con -)
          if (line.startsWith('- ')) {
            formattedPart = formattedPart.replace(
              /^- (.+?)( – Desde.+)?$/,
              '<strong class="text-primary">$1</strong>$2'
            );
          }
          
          // Resaltar emojis y puntos importantes
          formattedPart = formattedPart.replace(
            /(👉|🏔️|⛷️|🥾|🌍|❓|💌)/g,
            '<span class="text-lg">$1</span>'
          );
          
          return (
            <span
              key={partIndex}
              dangerouslySetInnerHTML={{ __html: formattedPart }}
            />
          );
        })}
      </div>
    );
  });
};

export const ChatMessage = ({ role, content, isStreaming = false }: ChatMessageProps) => {
  const isUser = role === 'user';
  
  // Log para debug del streaming
  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar className="w-8 h-8 bg-white">
          <AvatarImage src={'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/logos/logoulls.png'} alt="eWilly" />
          <AvatarFallback className="bg-white">
            <img 
              src={'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/logos/logoulls.png'} 
              alt="eWilly" 
              loading="lazy"
              decoding="async"
              className="w-6 h-6" 
            />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] rounded-lg p-3 ${
        isUser 
          ? 'bg-blue-100 text-blue-900' 
          : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="text-sm font-medium mb-1">
          {isUser ? 'Tú' : 'eWilly'}
        </div>
        <div className="text-sm">
          {content ? (
            <div>{formatMessageContent(content)}</div>
          ) : isStreaming && !content ? (
            <span className="animate-pulse">
              <span className="animate-bounce inline-block" style={{animationDelay: '0ms'}}>•</span>
              <span className="animate-bounce inline-block" style={{animationDelay: '150ms'}}>•</span>
              <span className="animate-bounce inline-block" style={{animationDelay: '300ms'}}>•</span>
            </span>
          ) : ''}
          {isStreaming && content && <span className="animate-pulse ml-1">▌</span>}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="w-8 h-8 bg-black">
          <AvatarFallback className="bg-black text-white">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

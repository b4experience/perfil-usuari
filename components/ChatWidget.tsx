// components/ChatWidget.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Phone, Signal } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/i18n/useT';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { usePromoBannerState } from '@/hooks/usePromoBannerState';

type ChatWidgetProps = Record<string, never>;

export const ChatWidget = (_props: ChatWidgetProps = {}) => {
  const { language } = useLanguage();
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldBeHighByDetection, setShouldBeHighByDetection] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasViewSelector, setHasViewSelector] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { isMinimized: isPromoBannerMinimized } = usePromoBannerState();

  const isPromoBannerActive = useCallback(() => {
    if (!isPromoBannerMinimized) {
      try {
        const promoBannerSelectors = [
          '[class*="PromoBanner"]',
          'div.fixed.bottom-0.left-0.right-0.z-\\[10001\\]',
          'div[data-promo-banner="true"]'
        ];
        
        for (const selector of promoBannerSelectors) {
          const promoBanner = document.querySelector(selector);
          if (promoBanner) {
            const style = window.getComputedStyle(promoBanner);
            const rect = promoBanner.getBoundingClientRect();
            
            const isVisible = style.display !== 'none' && 
                             style.visibility !== 'hidden' && 
                             rect.height > 40;
            
            return isVisible;
          }
        }
      } catch (error) {
        console.error('Error checking PromoBanner:', error);
      }
    }
    return false;
  }, [isPromoBannerMinimized]);
  
  const [shouldBeHigh, setShouldBeHigh] = useState(false);
  
  useEffect(() => {
    const calculateShouldBeHigh = () => {
      const promoBannerActive = isPromoBannerActive();
      const result = (!isPromoBannerMinimized && promoBannerActive) || shouldBeHighByDetection;
      setShouldBeHigh(result);
    };
    
    calculateShouldBeHigh();
    const timeoutId = setTimeout(calculateShouldBeHigh, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isPromoBannerMinimized, shouldBeHighByDetection, isPromoBannerActive]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkViewSelector = () => {
      const viewSelector = document.querySelector('[data-view-selector=\"true\"]') as HTMLElement | null;
      if (!viewSelector) {
        setHasViewSelector(false);
        return;
      }
      const style = window.getComputedStyle(viewSelector);
      const rect = viewSelector.getBoundingClientRect();
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0 && rect.width > 0;
      setHasViewSelector(visible);
    };

    checkViewSelector();
    const intervalId = setInterval(checkViewSelector, 1000);
    window.addEventListener('resize', checkViewSelector);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', checkViewSelector);
    };
  }, []);

  const bottomPosition = shouldBeHigh ? 100 : (isMobile && hasViewSelector ? 85 : 24);
  const chatHeight = isMobile
    ? `min(600px, calc(100vh - ${bottomPosition + 32}px))`
    : 'min(600px, calc(100vh - 120px))';

  const config = {
    ES: {
      quizUrl: 'https://quiz-es.b4experience.com/'
    },
    EN: {
      quizUrl: 'https://quiz-en.b4experience.com/'
    },
    FR: {
      quizUrl: 'https://quiz-en.b4experience.com/'
    }
  };
  const currentConfig = config[language] || config.EN;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openChat') === 'true') {
      setIsOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const checkForOtherBanners = () => {
      const otherBannerSelectors = [
        'div.fixed.bottom-0.left-0.right-0:not([class*="PromoBanner"])',
        'section.fixed.bottom-0:not([class*="PromoBanner"])',
        'footer.fixed.bottom-0',
        'div[style*="bottom: 0"]:not([class*="PromoBanner"])',
        'aside.fixed.bottom-0',
        'nav.fixed.bottom-0'
      ];
      
      let foundActiveBanner = false;
      
      for (const selector of otherBannerSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          
          for (const el of elements) {
            if (chatContainerRef.current && 
                (el === chatContainerRef.current || el.contains(chatContainerRef.current))) {
              continue;
            }
            
            const className = el.className || '';
            if (className.includes('PromoBanner') || 
                className.includes('z-[10001]')) {
              continue;
            }
            
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            
            const isVisible = style.display !== 'none' && 
                             style.visibility !== 'hidden' && 
                             rect.height > 0;
            
            if (isVisible && rect.height > 40) {
              const transform = style.transform || style.webkitTransform;
              const isMinimized = transform.includes('translateY(100%') || 
                                 transform.includes('matrix(1, 0, 0, 1, 0, 100)') ||
                                 (transform.includes('matrix') && transform.includes(', 100)'));
              
              if (!isMinimized) {
                foundActiveBanner = true;
                break;
              }
            }
          }
          
          if (foundActiveBanner) break;
        } catch (error) {
          console.warn('Error con selector:', selector, error);
        }
      }
      
      if (!foundActiveBanner) {
        const allFixedElements = document.querySelectorAll('*[style*="fixed"], *[class*="fixed"]');
        
        for (const el of allFixedElements) {
          try {
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') {
              continue;
            }
            
            if (chatContainerRef.current && 
                (el === chatContainerRef.current || el.contains(chatContainerRef.current))) {
              continue;
            }
            
            const className = el.className || '';
            if (className.includes('PromoBanner') || 
                className.includes('ChatWidget') ||
                className.includes('z-[10002]')) {
              continue;
            }
            
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            
            const isAtBottom = rect.bottom > window.innerHeight - 50 &&
                               rect.top < window.innerHeight &&
                               style.position === 'fixed';
            
            const isVisible = style.display !== 'none' && 
                             style.visibility !== 'hidden' && 
                             rect.height > 0;
            
            const looksLikeBanner = rect.height >= 40 && rect.height <= 150;
            
            if (isAtBottom && isVisible && looksLikeBanner) {
              const transform = style.transform || '';
              const isMinimized = transform.includes('translateY(100%') || 
                                 transform.includes('matrix(1, 0, 0, 1, 0, 100)');
              
              if (!isMinimized) {
                foundActiveBanner = true;
                break;
              }
            }
          } catch (error) {}
        }
      }
      
      setShouldBeHighByDetection(prev => {
        if (prev !== foundActiveBanner) {
          return foundActiveBanner;
        }
        return prev;
      });
    };

    const initialTimeout = setTimeout(checkForOtherBanners, 500);
    const intervalId = setInterval(checkForOtherBanners, 2000);
    
    const handleChange = () => {
      setTimeout(checkForOtherBanners, 300);
    };
    
    window.addEventListener('resize', handleChange);
    
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || 
             mutation.attributeName === 'class' ||
             mutation.attributeName === 'transform')) {
          shouldCheck = true;
        }
      });
      
      if (shouldCheck) {
        handleChange();
      }
    });
    
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'class', 'transform']
    });
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      window.removeEventListener('resize', handleChange);
      observer.disconnect();
    };
  }, []);

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/34613037700', '_blank');
  };
  
  const handleQuizClick = () => {
    window.open(currentConfig.quizUrl, '_blank');
  };

  return (
    <>
      <motion.div 
        ref={chatContainerRef}
        className="fixed right-4 md:right-6 z-[10002]" 
        initial={false}
        animate={{
          bottom: bottomPosition
        }}
        transition={{
          duration: 0.5,
          ease: [0.23, 1, 0.32, 1]
        }}
        style={{
          '--chat-widget': 'true'
        } as any}
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              onClick={() => setIsOpen(true)}
              initial={{
                scale: 0,
                opacity: 0
              }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: {
                  delay: 0.3,
                  duration: 0.4,
                  ease: [0.23, 1, 0.32, 1]
                }
              }}
              exit={{
                scale: 0,
                opacity: 0,
                transition: {
                  duration: 0.3,
                  ease: [0.23, 1, 0.32, 1]
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 text-white border-2 border-border rounded-full px-6 h-16 shadow-lg hover:shadow-xl font-semibold text-lg transition-colors bg-blue-700 hover:bg-blue-600"
              aria-label={t('chat.openChat') || (language === 'ES' ? 'Abrir chat de asistencia' : 'Open assistance chat')}
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ width: 64, height: 64, borderRadius: 32, opacity: 0 }}
              animate={{ 
                width: 'min(400px, calc(100vw - 32px))',
                height: chatHeight,
                borderRadius: 15,
                opacity: 1
              }}
              exit={{ width: 64, height: 64, borderRadius: 32, opacity: 0 }}
              className="bg-background shadow-2xl flex flex-col overflow-hidden border-2 border-black/60"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-stone-950 border-b-2 border-black/60">
                <h3 className="font-semibold text-white">{t('chat.title')}</h3>
                <button onClick={() => setIsOpen(false)} className="text-xl font-bold text-white hover:text-white/80">
                  ✕
                </button>
              </div>

              <div className="flex-1 min-h-0 border-b-2 border-black/60">
                <ChatContainer />
              </div>

              <div className="p-4 border-t-2 border-black/60 bg-muted/30 flex gap-3">
                <Button onClick={handleWhatsAppClick} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <Phone className="h-4 w-4 mr-2" />
                  {t('chat.whatsapp')}
                </Button>
                <Button onClick={handleQuizClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Signal className="h-4 w-4 mr-2" />
                  {t('chat.quizLabel')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

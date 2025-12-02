import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import UserGate from './components/UserGate';
import { api } from './api';
import './App.css';

const USER_DATA_WEBHOOK_URL =
  'https://aztec.app.n8n.cloud/webhook/648b110b-cf19-4250-9497-38f71551b090';

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isSubmittingUserInfo, setIsSubmittingUserInfo] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    loadConversations();
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile || !currentConversationId) return;
    loadConversation(currentConversationId);
  }, [currentConversationId, userProfile]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleUserGateSubmit = async ({ name, countryCode, phoneNumber }) => {
    setIsSubmittingUserInfo(true);
    try {
      const sanitizedNumber = phoneNumber.replace(/\D/g, '');
      const fullNumber = `${countryCode}${sanitizedNumber}`;
      const response = await fetch(USER_DATA_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          countryCode,
          phoneNumber: sanitizedNumber,
          fullNumber,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Webhook error ${response.status}: ${errorBody || 'sin contenido'}`
        );
      }

      setUserProfile({ name, countryCode, phoneNumber: sanitizedNumber, fullNumber });
    } catch (error) {
      console.error('Failed to submit user info:', error);
      alert('No se pudo enviar tus datos. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmittingUserInfo(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations((prev) => [
        { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
        ...prev,
      ]);
      setCurrentConversationId(newConv.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert(`Failed to create conversation. Error details: ${error.message}`);
    }
  };

  const handleClearConversations = async () => {
    if (!window.confirm('¿Seguro que quieres borrar todas las conversaciones?')) {
      return;
    }

    try {
      await api.clearConversations();
      setConversations([]);
      setCurrentConversation(null);
      setCurrentConversationId(null);
    } catch (error) {
      console.error('Failed to clear conversations:', error);
      alert('No se pudo borrar el historial. Intenta de nuevo.');
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId) return;

    setIsLoading(true);
    try {
      // Optimistically add user message to UI
      const userMessage = { role: 'user', content };
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Create a partial assistant message that will be updated progressively
      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };

      // Add the partial assistant message
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Send message with streaming
      await api.sendMessageStream(currentConversationId, content, (eventType, event) => {
        switch (eventType) {
          case 'stage1_start':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage1 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage1_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage1 = event.data;
              lastMsg.loading.stage1 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage2_start':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage2 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage2_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage2 = event.data;
              lastMsg.metadata = event.metadata;
              lastMsg.loading.stage2 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage3_start':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage3 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage3_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage3 = event.data;
              lastMsg.loading.stage3 = false;
              return { ...prev, messages };
            });
            break;

          case 'title_complete':
            // Reload conversations to get updated title
            loadConversations();
            break;

          case 'complete':
            // Stream complete, reload conversations list
            loadConversations();
            setIsLoading(false);
            break;

          case 'error': {
            console.error('Stream error:', event.message);
            setIsLoading(false);
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              if (!lastMsg) return prev;
              if (lastMsg.loading) {
                lastMsg.loading.stage1 = false;
                lastMsg.loading.stage2 = false;
                lastMsg.loading.stage3 = false;
              }
              lastMsg.stage3 = {
                model: 'error',
                response:
                  event.message ||
                  'Ocurrió un error durante la consulta al backend.',
              };
              return { ...prev, messages };
            });
            break;
          }

          default:
            console.log('Unknown event type:', eventType);
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic messages on error
      setCurrentConversation((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -2),
      }));
      setIsLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <UserGate
        onSubmit={handleUserGateSubmit}
        isSubmitting={isSubmittingUserInfo}
      />
    );
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onClearConversations={handleClearConversations}
      />
      <ChatInterface
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;

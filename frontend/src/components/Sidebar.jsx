import { useState, useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onClearConversations,
  isOpen,
  onClose,
}) {
  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />
      <div className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <h1>LLM Council</h1>
            <button className="close-sidebar-btn" onClick={onClose}>×</button>
          </div>
          <button className="new-conversation-btn" onClick={() => {
            onNewConversation();
            onClose(); // Close on mobile when clicking new
          }}>
            + New Conversation
          </button>
        <button
          className="clear-conversations-btn"
          onClick={onClearConversations}
          title="Eliminar todas las conversaciones guardadas"
        >
          Borrar historial
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${
                conv.id === currentConversationId ? 'active' : ''
              }`}
              onClick={() => {
                onSelectConversation(conv.id);
                onClose(); // Close sidebar on mobile when selecting
              }}
            >
              <div className="conversation-title">
                {conv.title || 'New Conversation'}
              </div>
              <div className="conversation-meta">
                {conv.message_count} messages
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

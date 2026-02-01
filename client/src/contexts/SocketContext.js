import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    // Session events
    newSocket.on('session-created', (data) => {
      setSession(data.session);
    });

    newSocket.on('session-joined', (data) => {
      setSession(data.session);
    });

    newSocket.on('session-error', (data) => {
      console.error('Session error:', data.message);
      alert(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const createSession = (vendorLanguage, categories) => {
    if (socket) {
      socket.emit('create-session', { 
        language: vendorLanguage,
        categories 
      });
      setRole('vendor');
      setLanguage(vendorLanguage);
    }
  };

  const joinSession = (sessionId, customerLanguage) => {
    if (socket) {
      socket.emit('join-session', { 
        sessionId, 
        language: customerLanguage 
      });
      setRole('customer');
      setLanguage(customerLanguage);
    }
  };

  const updateInventory = (payload) => {
  if (!socket || !session) return;

  let products, floorPrices;

  if (payload?.products) {
    // new style
    products = payload.products;
    floorPrices = payload.floorPrices;
  } else if (Array.isArray(payload)) {
    // old style
    products = payload;
    floorPrices = payload.reduce((acc, p) => {
      acc[p.id] = p.floorPrice;
      return acc;
    }, {});
  }

  socket.emit('update-inventory', {
    sessionId: session.id,
    products,
    floorPrices
  });
};


  const requestProducts = (requestedProducts) => {
    if (socket && session) {
      socket.emit('request-products', {
        sessionId: session.id,
        requestedProducts
      });
    }
  };

  const proposePrice = (productId, proposedPrice, round, marketPrice,language) => {
    if (socket && session) {
      socket.emit('propose-price', {
        sessionId: session.id,
        productId,
        proposedPrice,
        round,
        marketPrice,
        language
      });
    }
  };

  const respondToNegotiation = (negotiationId, response, finalPrice) => {
    if (socket && session) {
      socket.emit('respond-negotiation', {
        sessionId: session.id,
        negotiationId,
        response,
        finalPrice
      });
    }
  };

  const addNewProducts = (newProducts, newFloorPrices) => {
    if (socket && session) {
      socket.emit('add-new-products', {
        sessionId: session.id,
        newProducts,
        newFloorPrices
      });
    }
  };

  const sendCustomMessage = (message) => {
    if (socket && session) {
      socket.emit('send-custom-message', {
        sessionId: session.id,
        message,
        senderRole: role
      });
    }
  };

  const value = {
    socket,
    connected,
    session,
    role,
    language,
    setLanguage,
    createSession,
    joinSession,
    updateInventory,
    addNewProducts,
    requestProducts,
    proposePrice,
    respondToNegotiation,
    sendCustomMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
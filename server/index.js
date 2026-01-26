require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const AIPriceService = require('./services/aiPriceService');
const NegotiationAgent = require('./services/negotiationAgent');
const MessageTransformService = require('./services/messageTransformService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const aiPriceService = new AIPriceService();
const negotiationAgent = new NegotiationAgent();
const messageTransformService = new MessageTransformService();

app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    categories: ['vegetables', 'fruits'],
    aiServices: {
      priceService: !!aiPriceService,
      negotiationAgent: !!negotiationAgent,
      messageTransform: !!messageTransformService
    }
  });
});

// Simple health check for AI services
app.get('/api/health', async (req, res) => {
  try {
    // Test if AI services are initialized
    const health = {
      server: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        aiPriceService: aiPriceService ? 'Initialized' : 'Failed',
        negotiationAgent: negotiationAgent ? 'Initialized' : 'Failed',
        messageTransformService: messageTransformService ? 'Initialized' : 'Failed'
      },
      apiKeys: {
        count: aiPriceService?.apiKeys?.length || 0,
        current: aiPriceService?.currentKeyIndex || 0
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      server: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.get('/api/mandi-prices', async (req, res) => {
  try {
    const { product, location } = req.query;
    
    if (!product) {
      return res.status(400).json({ error: 'Product parameter is required' });
    }

    const priceData = await aiPriceService.getLivePrice(product, location);
    res.json(priceData);
  } catch (error) {
    console.error('Error fetching AI prices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market prices',
      fallback: aiPriceService.getFallbackPrice(req.query.product, req.query.location)
    });
  }
});
app.get('/api/products/:category', async (req, res) => {
  try {
    let { category } = req.params;
    const { location } = req.query;

    console.log(`📦 Products API called: category=${category}, location=${location}`);
    category = category.toLowerCase().trim();

    if (!['vegetables', 'fruits'].includes(category)) {
      return res.status(404).json({ error: 'Category not found. Only vegetables and fruits are supported.' });
    }

    const products = await aiPriceService.getCategoryProducts(category, location);

    console.log(`✅ Returning ${products.length} AI-powered products`);
    res.json(products);

  } catch (error) {
    console.error('❌ Error in products API:', error.message);
    res.status(500).json({ 
      error: 'AI service failed to generate products and prices',
      details: error.message
    });
  }
});


app.post('/api/transform-message', async (req, res) => {
  try {
    const { text, senderRole, senderLanguage, recipientLanguage } = req.body;
    
    if (!text || !senderRole) {
      return res.status(400).json({ error: 'Text and senderRole are required' });
    }

    const transformedMessage = await messageTransformService.transformMessage(
      text, 
      senderRole, 
      senderLanguage || 'en', 
      recipientLanguage || 'en'
    );
    
    res.json(transformedMessage);
  } catch (error) {
    console.error('Error transforming message:', error);
    res.status(500).json({ 
      error: 'Failed to transform message',
      fallback: messageTransformService.fallbackTransform(req.body.text, req.body.senderRole)
    });
  }
});

app.get('/api/languages', (req, res) => {
  res.json(messageTransformService.getSupportedLanguages());
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log('✓ User connected:', socket.id);

  socket.on('create-session', (data) => {
    const sessionId = generateSessionId();
    const session = {
      id: sessionId,
      vendorId: socket.id,
      vendorLanguage: data.language,
      customerId: null,
      customerLanguage: null,
      status: 'waiting',
      products: [],
      customerCart: [],  // NEW: Track customer cart
      negotiations: [],
      messages: [],
      createdAt: new Date()
    };
    
    sessions.set(sessionId, session);
    socket.join(sessionId);
    
    console.log(`✓ Session created: ${sessionId} by vendor ${socket.id}`);
    
    socket.emit('session-created', { sessionId, session });
  });
    // Vendor edits price anytime
  socket.on('vendor-price-edit', ({ sessionId, productId, newPrice }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    // Only vendor is allowed
    if (session.vendorId !== socket.id) return;

    const product = session.products.find(p => p.id === productId);
    if (!product) return;

    product.vendorPrice = Number(newPrice);

    console.log(`✏️ Vendor updated price: ${product.name} → ₹${newPrice}`);

    // Broadcast updated inventory to both vendor & customer
    io.to(sessionId).emit('inventory-updated', {
      products: session.products
    });
  });

  socket.on('join-session', (data) => {
    const { sessionId, language } = data;
    const session = sessions.get(sessionId);
    
    if (!session) {
      console.log(`❌ Session not found: ${sessionId}`);
      socket.emit('session-error', { message: 'Session not found' });
      return;
    }
    
    if (session.customerId) {
      console.log(`❌ Session ${sessionId} already has a customer`);
      socket.emit('session-error', { message: 'Session already has a customer' });
      return;
    }
    
    session.customerId = socket.id;
    session.customerLanguage = language;
    session.status = 'active';
    
    socket.join(sessionId);
    
    console.log(`✓ Customer ${socket.id} joined session ${sessionId}`);
    
    io.to(sessionId).emit('session-joined', { session });
    
    if (session.products.length > 0) {
      socket.emit('inventory-updated', { products: session.products });
    }
  });

  socket.on('update-inventory', (data) => {
    const { sessionId, products, floorPrices } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.vendorId === socket.id) {
      session.products = products;
      
      console.log(`✓ Inventory updated for session ${sessionId}: ${products.length} products`);
      
      if (floorPrices) {
        console.log('✓ Initializing negotiation agent with floor prices:', floorPrices);
        negotiationAgent.initializeSession(sessionId, floorPrices);
      } else {
        console.warn('⚠️  Warning: No floor prices provided!');
      }
      
      io.to(sessionId).emit('inventory-updated', { products });
    }
  });

  socket.on('get-products', (data) => {
    const { sessionId } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.products.length > 0) {
      socket.emit('inventory-updated', { products: session.products });
      console.log(`✓ Sent ${session.products.length} products to ${socket.id}`);
    }
  });

  // NEW: Real-time cart updates
  socket.on('cart-updated', (data) => {
    const { sessionId, cart } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.customerId === socket.id) {
      session.customerCart = cart;
      console.log(`🛒 Customer cart updated: ${cart.length} items`);
      
      // Notify vendor immediately
      if (session.vendorId) {
        io.to(session.vendorId).emit('customer-cart-updated', {
          cart,
          customerId: socket.id,
          timestamp: new Date()
        });
      }
    }
  });

  // NEW: Individual cart item updates
  socket.on('cart-item-added', (data) => {
    const { sessionId, item } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.customerId === socket.id) {
      console.log(`🛒 Item added to cart: ${item.name} x ${item.quantity}kg`);
      
      // Notify vendor
      if (session.vendorId) {
        io.to(session.vendorId).emit('customer-cart-item-added', {
          item,
          customerId: socket.id,
          timestamp: new Date()
        });
      }
    }
  });

  // NEW: Cart item removed
  socket.on('cart-item-removed', (data) => {
    const { sessionId, productId } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.customerId === socket.id) {
      console.log(`🛒 Item removed from cart: ${productId}`);
      
      // Notify vendor
      if (session.vendorId) {
        io.to(session.vendorId).emit('customer-cart-item-removed', {
          productId,
          customerId: socket.id,
          timestamp: new Date()
        });
      }
    }
  });

  // NEW: Cart quantity changed
  socket.on('cart-quantity-changed', (data) => {
    const { sessionId, productId, newQuantity } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.customerId === socket.id) {
      console.log(`🛒 Quantity changed: ${productId} → ${newQuantity}kg`);
      
      // Notify vendor
      if (session.vendorId) {
        io.to(session.vendorId).emit('customer-cart-quantity-changed', {
          productId,
          newQuantity,
          customerId: socket.id,
          timestamp: new Date()
        });
      }
    }
  });

  socket.on('request-products', (data) => {
    const { sessionId, requestedProducts } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.customerId === socket.id) {
      console.log(`✓ Products requested by customer ${socket.id}:`, requestedProducts);
      
      io.to(session.vendorId).emit('products-requested', { 
        requestedProducts,
        customerId: socket.id 
      });
    }
  });

  socket.on('propose-price', async (data) => {
    try {
      const { sessionId, productId, proposedPrice, marketPrice, round = 1 } = data;
      const session = sessions.get(sessionId);
      
      if (!session) {
        socket.emit('negotiation-error', { message: 'Session not found' });
        return;
      }

      console.log(`💬 Negotiation - Product: ${productId}, Proposed: ₹${proposedPrice}, Round: ${round}`);

      const negotiationResult = await negotiationAgent.handleNegotiation(
        sessionId, 
        productId, 
        proposedPrice, 
        marketPrice, 
        round
      );
      
      const negotiation = {
        id: uuidv4(),
        productId,
        proposedPrice,
        round,
        timestamp: new Date(),
        status: negotiationResult.action,
        aiResponse: negotiationResult
      };
      
      session.negotiations.push(negotiation);
      
      console.log(`✓ Negotiation result: ${negotiationResult.action}`);
      
      io.to(sessionId).emit('negotiation-update', {
        negotiation,
        result: negotiationResult
      });
      
    } catch (error) {
      console.error('❌ Negotiation error:', error);
      socket.emit('negotiation-error', { message: error.message || 'Failed to process negotiation' });
    }
  });

  socket.on('respond-negotiation', (data) => {
    const { sessionId, negotiationId, response, finalPrice } = data;
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('negotiation-error', { message: 'Session not found' });
      return;
    }

    const negotiation = session.negotiations.find(n => n.id === negotiationId);
    if (!negotiation) {
      socket.emit('negotiation-error', { message: 'Negotiation not found' });
      return;
    }

    negotiation.status = response;
    negotiation.finalPrice = finalPrice;

    console.log(`✓ Vendor responded: ${response} at ₹${finalPrice}`);

    if (session.customerId) {
      io.to(session.customerId).emit('negotiation-response', {
        negotiation,
        response,
        finalPrice
      });
    }

    socket.emit('negotiation-updated', { negotiation, response, finalPrice });
  });

  socket.on('update-floor-prices', (data) => {
    const { sessionId, floorPrices } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.vendorId === socket.id) {
      negotiationAgent.initializeSession(sessionId, floorPrices);
      socket.emit('floor-prices-updated', { success: true });
      console.log(`✓ Floor prices updated for session ${sessionId}`);
    }
  });

  socket.on('send-custom-message', async (data) => {
    try {
      const { sessionId, message, senderRole, senderLanguage, recipientLanguage } = data;
      const session = sessions.get(sessionId);
      
      if (!session) {
        socket.emit('message-error', { message: 'Session not found' });
        return;
      }

      console.log(`💬 Custom message from ${senderRole}: "${message}"`);

      // Determine recipient language automatically
      const actualRecipientLanguage = recipientLanguage || 
        (senderRole === 'vendor' ? session.customerLanguage : session.vendorLanguage) || 
        'en';

      const transformedMessage = await messageTransformService.transformMessage(
        message,
        senderRole,
        senderLanguage || (senderRole === 'vendor' ? session.vendorLanguage : session.customerLanguage) || 'en',
        actualRecipientLanguage
      );
      
      console.log(`✓ Transformed to: "${transformedMessage.indirect}"`);
      
      const messageObj = {
        id: uuidv4(),
        ...transformedMessage,
        sessionId,
        timestamp: new Date()
      };
      
      session.messages.push(messageObj);
      
      const targetId = senderRole === 'vendor' ? session.customerId : session.vendorId;
      if (targetId) {
        io.to(targetId).emit('custom-message-received', {
          message: messageObj,
          notification: true
        });
      }
      
      socket.emit('message-sent', { messageId: messageObj.id });
      
    } catch (error) {
      console.error('❌ Error sending custom message:', error);
      socket.emit('message-error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('✗ User disconnected:', socket.id);
    
    for (const [sessionId, session] of sessions.entries()) {
      if (session.vendorId === socket.id || session.customerId === socket.id) {
        session.status = 'disconnected';
        negotiationAgent.clearSession(sessionId);
        
        console.log(`✗ Session ${sessionId} marked as disconnected`);
        
        io.to(sessionId).emit('user-disconnected', { 
          disconnectedRole: session.vendorId === socket.id ? 'vendor' : 'customer'
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('════════════════════════════════════════════════════════');
  console.log(`  🎪 Multilingual Mandi Server`);
  console.log(`  📍 Running on http://localhost:${PORT}`);
  console.log(`  🌐 Socket.IO enabled`);
  console.log(`  🛒 Real-time cart sync enabled`);
  console.log(`  📦 Categories: Vegetables, Fruits only`);
  console.log('════════════════════════════════════════════════════════');
  console.log('');
});
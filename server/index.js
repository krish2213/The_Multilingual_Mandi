require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Razorpay integration
const Razorpay = require('razorpay');
const razorpay_key_id = process.env.RAZORPAY_KEY_ID;
const razorpay_key_secret = process.env.RAZORPAY_KEY_SECRET;
const razorpay_client = razorpay_key_id && razorpay_key_secret ? 
  new Razorpay({ key_id: razorpay_key_id, key_secret: razorpay_key_secret }) : null;

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

// Serve static files from public directory (for React build and images)
app.use(express.static('public'));
console.log('✓ Static files served from public/ directory at root');

// Also serve static files at /static path for explicit access
app.use('/static', express.static('public/static'));
console.log('✓ Static files also served from public/static at /static');

const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Test endpoint for static files
app.get('/api/test-image', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const imagePath = path.join(__dirname, '../public/static/vegetables/potato.png');
  const exists = fs.existsSync(imagePath);
  
  res.json({
    message: 'Static file test',
    imagePath: imagePath,
    exists: exists,
    staticConfig: {
      root: 'public/',
      staticPath: '/static -> public/static'
    },
    testUrls: [
      'http://localhost:5000/static/vegetables/potato.png',
      'http://localhost:3000/static/vegetables/potato.png'
    ]
  });
});

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
    },
    staticFiles: {
      configured: true,
      path: '/static',
      serves: 'public/static'
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
    console.error('❌ AI price generation failed:', error);
    // NO FALLBACKS - Pure AI system as per steering guidelines
    res.status(500).json({ 
      error: 'AI price generation failed. No fallback prices available.',
      message: 'This system uses pure AI pricing without fallbacks.'
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

    console.log(`✅ Returning ${products.length} products with AI pricing`);
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
    
    console.log(`📨 Transform request: "${text}" from ${senderLanguage} (${senderRole}) to ${recipientLanguage}`);
    
    if (!text || !senderRole) {
      return res.status(400).json({ error: 'Text and senderRole are required' });
    }

    const transformedMessage = await messageTransformService.transformMessage(
      text, 
      senderRole, 
      senderLanguage || 'en', 
      recipientLanguage || 'en'
    );
    
    console.log(`✅ Transform response:`, transformedMessage);
    res.json(transformedMessage);
  } catch (error) {
    console.error('❌ Error transforming message:', error);
    res.status(500).json({ 
      error: 'Failed to transform message',
      details: error.message
    });
  }
});

app.get('/api/languages', (req, res) => {
  res.json(messageTransformService.getSupportedLanguages());
});

// Payment Routes
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, sessionId, cart } = req.body;
    
    if (!razorpay_client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Payment gateway not configured' 
      });
    }

    // Create order in Razorpay (amount in paise)
    const order_amount = Math.round(amount * 100);
    const order_currency = 'INR';
    const order_receipt = `mandi_${sessionId}_${Date.now()}`;

    const order = await razorpay_client.orders.create({
      amount: order_amount,
      currency: order_currency,
      receipt: order_receipt,
      notes: {
        sessionId: sessionId,
        items: cart.length,
        platform: 'multilingual_mandi'
      }
    });

    console.log(`💳 Razorpay order created: ${order.id} for ₹${amount}`);

    res.json({
      success: true,
      order_id: order.id,
      amount: order_amount,
      currency: order_currency,
      key_id: razorpay_key_id
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error creating order: ${error.message}` 
    });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      sessionId,
      cart,
      totalAmount 
    } = req.body;

    if (!razorpay_client) {
      return res.status(500).json({ 
        success: false, 
        message: 'Payment gateway not configured' 
      });
    }

    // Verify signature
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', razorpay_key_secret)
      .update(message)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }

    // Fetch payment details
    const payment = await razorpay_client.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({ 
        success: false, 
        message: `Payment not successful. Status: ${payment.status}` 
      });
    }

    console.log(`✅ Payment verified: ${razorpay_payment_id} for ₹${totalAmount}`);

    // Process the payment (reduce stock)
    const session = sessions.get(sessionId);
    if (session) {
      // Reduce stock quantities
      cart.forEach(cartItem => {
        const product = session.products.find(p => p.id === cartItem.productId);
        if (product) {
          product.quantity = Math.max(0, product.quantity - cartItem.quantity);
        }
      });

      // Broadcast updated inventory
      io.to(sessionId).emit('inventory-updated', {
        products: session.products
      });

      // Notify vendor about the sale
      if (session.vendorId) {
        io.to(session.vendorId).emit('sale-completed', {
          cart: cart,
          totalAmount: totalAmount,
          paymentMethod: 'UPI/Razorpay',
          paymentId: razorpay_payment_id,
          timestamp: new Date()
        });
      }
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      payment_id: razorpay_payment_id,
      transaction_id: `TXN${Date.now()}`
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      message: `Payment verification error: ${error.message}` 
    });
  }
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

  // NEW: Vendor updates stock quantity
  socket.on('vendor-stock-edit', ({ sessionId, productId, newQuantity }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    // Only vendor is allowed
    if (session.vendorId !== socket.id) return;

    const product = session.products.find(p => p.id === productId);
    if (!product) return;

    product.quantity = Number(newQuantity);

    console.log(`📦 Vendor updated stock: ${product.name} → ${newQuantity}kg`);

    // Broadcast updated inventory to both vendor & customer
    io.to(sessionId).emit('inventory-updated', {
      products: session.products
    });

    // Check if customer cart needs adjustment
    if (session.customerCart.length > 0) {
      const cartItem = session.customerCart.find(c => c.productId === productId);
      if (cartItem && cartItem.quantity > newQuantity) {
        // Notify customer about stock reduction
        if (session.customerId) {
          io.to(session.customerId).emit('stock-reduced', {
            productId,
            productName: product.name,
            newStock: newQuantity,
            currentCartQuantity: cartItem.quantity
          });
        }
      }
    }
  });

  // NEW: Vendor adds new products to existing session
  socket.on('add-new-products', (data) => {
    const { sessionId, newProducts, newFloorPrices } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.vendorId === socket.id) {
      // Add new products to existing inventory
      session.products = [...session.products, ...newProducts];
      
      console.log(`✓ Added ${newProducts.length} new products to session ${sessionId}`);
      
      // Update negotiation agent with new floor prices
      if (newFloorPrices) {
        const existingFloorPrices = negotiationAgent.getFloorPrices(sessionId) || {};
        const combinedFloorPrices = { ...existingFloorPrices, ...newFloorPrices };
        negotiationAgent.initializeSession(sessionId, combinedFloorPrices);
      }
      
      // Broadcast updated inventory to both vendor & customer
      io.to(sessionId).emit('inventory-updated', { products: session.products });
    }
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

  // NEW: Individual cart item updates with STOCK VALIDATION
  socket.on('cart-item-added', (data) => {
    const { sessionId, item } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.customerId === socket.id) {
      // CRITICAL: Validate stock availability
      const product = session.products.find(p => p.id === item.productId);
      if (!product) {
        socket.emit('cart-error', { message: 'Product not found' });
        return;
      }
      
      // CRITICAL FIX: Update session cart state properly
      const currentCartItem = session.customerCart.find(c => c.productId === item.productId);
      const currentCartQuantity = currentCartItem ? currentCartItem.quantity : 0;
      const totalRequestedQuantity = currentCartQuantity + item.quantity;
      
      if (totalRequestedQuantity > product.quantity) {
        socket.emit('cart-error', { 
          message: `Only ${product.quantity}kg available. You already have ${currentCartQuantity}kg in cart.`,
          availableStock: product.quantity,
          currentInCart: currentCartQuantity
        });
        return;
      }
      
      // CRITICAL FIX: Actually update the session cart
      if (currentCartItem) {
        currentCartItem.quantity = totalRequestedQuantity;
      } else {
        session.customerCart.push({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price || product.marketPrice
        });
      }
      
      console.log(`🛒 Item added to cart: ${item.name} x ${item.quantity}kg (Total in cart: ${totalRequestedQuantity}kg, Stock: ${product.quantity}kg)`);
      
      // Notify vendor with updated cart
      if (session.vendorId) {
        io.to(session.vendorId).emit('customer-cart-updated', {
          cart: session.customerCart,
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
      // CRITICAL FIX: Actually remove from session cart
      const removedItem = session.customerCart.find(c => c.productId === productId);
      session.customerCart = session.customerCart.filter(c => c.productId !== productId);
      
      console.log(`🛒 Item removed from cart: ${removedItem ? removedItem.name : productId}`);
      
      // Notify vendor with updated cart
      if (session.vendorId) {
        io.to(session.vendorId).emit('customer-cart-updated', {
          cart: session.customerCart,
          customerId: socket.id,
          timestamp: new Date()
        });
      }
    }
  });

  // NEW: Cart quantity changed with STOCK VALIDATION
  socket.on('cart-quantity-changed', (data) => {
    const { sessionId, productId, newQuantity } = data;
    const session = sessions.get(sessionId);
    
    if (session && session.customerId === socket.id) {
      // CRITICAL: Validate stock availability
      const product = session.products.find(p => p.id === productId);
      if (!product) {
        socket.emit('cart-error', { message: 'Product not found' });
        return;
      }
      
      if (newQuantity > product.quantity) {
        socket.emit('cart-error', { 
          message: `Only ${product.quantity}kg available for ${product.name}`,
          availableStock: product.quantity,
          productId: productId
        });
        return;
      }
      
      // CRITICAL FIX: Actually update the session cart
      const cartItem = session.customerCart.find(c => c.productId === productId);
      if (cartItem) {
        cartItem.quantity = newQuantity;
      } else if (newQuantity > 0) {
        // Add new item if it doesn't exist and quantity > 0
        session.customerCart.push({
          productId: productId,
          name: product.name,
          quantity: newQuantity,
          price: product.marketPrice
        });
      }
      
      // Remove item if quantity is 0
      if (newQuantity === 0) {
        session.customerCart = session.customerCart.filter(c => c.productId !== productId);
      }
      
      console.log(`🛒 Quantity changed: ${product.name} → ${newQuantity}kg (Stock: ${product.quantity}kg)`);
      
      // Notify vendor with updated cart
      if (session.vendorId) {
        io.to(session.vendorId).emit('customer-cart-updated', {
          cart: session.customerCart,
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

      console.log(`💬 Negotiation - Product: ${productId}, Proposed: ₹${proposedPrice}, Market: ₹${marketPrice}, Round: ${round}`);

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
      
      // Translate AI-generated messages to customer's language
      let finalMessage = negotiationResult.message;
      // NegotiationAgent already handles tone. ONLY translate if needed.
      if (negotiationResult.aiGenerated && session.customerLanguage && session.customerLanguage !== 'en') {
        try {
          console.log(`🌐 Translating negotiation message (NO polite rewrite)`);
          finalMessage = await negotiationAgent.translateMessage(
            negotiationResult.message,
            session.customerLanguage
          );
        } catch (error) {
          console.error('❌ Negotiation translation failed:', error.message);
        }
      }

      
      // Update the result with translated message
      const finalResult = {
        ...negotiationResult,
        message: finalMessage
      };
      
      console.log(`📤 Sending negotiation-update to customer:`, {
        negotiation: { id: negotiation.id, productId, proposedPrice, round },
        result: { action: finalResult.action, message: finalResult.message }
      });
      
      // Send negotiation update to customer
      socket.emit('negotiation-update', {
        negotiation,
        result: finalResult
      });

      // If vendor approval is required, notify vendor
      if (negotiationResult.action === 'pending_vendor_approval') {
        console.log(`🔔 Notifying vendor of price proposal above floor price`);
        
        if (session.vendorId) {
          io.to(session.vendorId).emit('vendor-approval-request', {
            negotiation,
            result: negotiationResult,
            product: session.products.find(p => p.id === productId),
            customerId: socket.id
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Negotiation error:', error);
      socket.emit('negotiation-error', { message: error.message || 'Failed to process negotiation' });
    }
  });

  // NEW: Handle vendor approval response
  socket.on('vendor-approval-response', async (data) => {
    try {
      const { sessionId, negotiationId, response, customMessage } = data;
      const session = sessions.get(sessionId);
      
      if (!session || session.vendorId !== socket.id) {
        socket.emit('error', { message: 'Unauthorized or session not found' });
        return;
      }

      const negotiation = session.negotiations.find(n => n.id === negotiationId);
      if (!negotiation) {
        socket.emit('error', { message: 'Negotiation not found' });
        return;
      }

      console.log(`🏪 Vendor approval response: ${response} for negotiation ${negotiationId}`);

      const vendorResponse = negotiationAgent.handleVendorResponse(
        sessionId,
        negotiation.productId,
        response,
        customMessage
      );

      // Update negotiation status
      negotiation.status = vendorResponse.action;
      negotiation.vendorResponse = vendorResponse;

      // Notify customer of vendor response
      if (session.customerId) {
        io.to(session.customerId).emit('vendor-response-received', {
          negotiation,
          response: vendorResponse,
          product: session.products.find(p => p.id === negotiation.productId)
        });

        // If accepted, update cart with agreed price
        if (response === 'accept') {
          io.to(session.customerId).emit('price-accepted', {
            productId: negotiation.productId,
            agreedPrice: negotiation.proposedPrice,
            negotiationId: negotiationId
          });
        }
      }

      // Confirm to vendor
      socket.emit('approval-response-sent', {
        negotiationId,
        response,
        success: true
      });

    } catch (error) {
      console.error('❌ Vendor approval response error:', error.message);
      socket.emit('error', { 
        message: `Approval response failed: ${error.message}` 
      });
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
      console.log(`🌐 Language flow: ${senderLanguage} → ${recipientLanguage}`);
      console.log(`📋 Session languages: Vendor=${session.vendorLanguage}, Customer=${session.customerLanguage}`);

      // Determine recipient language automatically if not provided
      const actualRecipientLanguage = recipientLanguage || 
        (senderRole === 'vendor' ? session.customerLanguage : session.vendorLanguage) || 
        'en';
      
      const actualSenderLanguage = senderLanguage || 
        (senderRole === 'vendor' ? session.vendorLanguage : session.customerLanguage) || 
        'en';

      console.log(`✅ Final language mapping: ${actualSenderLanguage} (${senderRole}) → ${actualRecipientLanguage}`);

      const transformedMessage = await messageTransformService.transformMessage(
        message,
        senderRole,
        actualSenderLanguage,
        actualRecipientLanguage
      );
      
      console.log(`✓ Transformed message:`);
      console.log(`   Original: "${transformedMessage.original}"`);
      console.log(`   Translated: "${transformedMessage.translated}"`);
      console.log(`   Indirect: "${transformedMessage.indirect}"`);
      
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



  
  // NEW: Process payment and reduce stock (Updated for multiple payment methods)
  socket.on('process-payment', (data) => {
    const { sessionId, cart, totalAmount, paymentMethod } = data;
    const session = sessions.get(sessionId);
    
    console.log(`💳 Payment request received:`, { sessionId, paymentMethod, totalAmount, cartItems: cart.length });
    
    if (!session) {
      console.error(`❌ Session not found: ${sessionId}`);
      socket.emit('payment-error', { message: 'Session not found' });
      return;
    }
    
    if (session.customerId !== socket.id) {
      console.error(`❌ Unauthorized payment attempt: ${socket.id} not customer of ${sessionId}`);
      socket.emit('payment-error', { message: 'Unauthorized payment attempt' });
      return;
    }
    
    if (paymentMethod === 'CASH') {
      console.log(`💰 Processing cash payment for session ${sessionId}`);
      
      // For cash payments, notify vendor for confirmation
      if (session.vendorId) {
        const paymentData = {
          cart: cart,
          totalAmount: totalAmount,
          customerId: socket.id,
          timestamp: new Date(),
          paymentId: `CASH_${Date.now()}`
        };
        
        console.log(`📤 Sending cash payment notification to vendor ${session.vendorId}`);
        io.to(session.vendorId).emit('cash-payment-pending', paymentData);
        
        // Notify customer that vendor confirmation is needed
        socket.emit('payment-pending', {
          message: 'Cash payment initiated. Waiting for vendor confirmation.',
          paymentMethod: 'CASH'
        });
        
        console.log(`✓ Cash payment process initiated for ${sessionId}`);
      } else {
        console.error(`❌ No vendor found for session ${sessionId}`);
        socket.emit('payment-error', { message: 'Vendor not available' });
      }
      
    } else if (paymentMethod === 'UPI') {
      console.log(`💳 Processing UPI payment for session ${sessionId}`);
      
      // For UPI, we'll handle this via Razorpay on the client side
      socket.emit('payment-redirect', {
        message: 'Redirecting to UPI payment...',
        paymentMethod: 'UPI'
      });
    } else {
      console.error(`❌ Unknown payment method: ${paymentMethod}`);
      socket.emit('payment-error', { message: 'Invalid payment method' });
    }
  });

  // NEW: Vendor confirms cash payment
  socket.on('confirm-cash-payment', (data) => {
    const { sessionId, paymentId, cart, totalAmount } = data;
    const session = sessions.get(sessionId);
    
    console.log(`💰 Cash payment confirmation received:`, { sessionId, paymentId, totalAmount });
    
    if (!session) {
      console.error(`❌ Session not found: ${sessionId}`);
      socket.emit('payment-error', { message: 'Session not found' });
      return;
    }
    
    if (session.vendorId !== socket.id) {
      console.error(`❌ Unauthorized confirmation attempt: ${socket.id} not vendor of ${sessionId}`);
      socket.emit('payment-error', { message: 'Unauthorized confirmation attempt' });
      return;
    }
    
    console.log(`✅ Vendor confirmed cash payment: ₹${totalAmount}`);
    
    // Reduce stock quantities
    cart.forEach(cartItem => {
      const product = session.products.find(p => p.id === cartItem.productId);
      if (product) {
        const oldQuantity = product.quantity;
        product.quantity = Math.max(0, product.quantity - cartItem.quantity);
        console.log(`📦 Stock reduced: ${product.name} ${oldQuantity}kg → ${product.quantity}kg`);
      }
    });
    
    // Broadcast updated inventory
    io.to(sessionId).emit('inventory-updated', {
      products: session.products
    });
    
    // Notify customer about successful payment
    if (session.customerId) {
      console.log(`📤 Notifying customer ${session.customerId} about payment confirmation`);
      io.to(session.customerId).emit('payment-confirmed', {
        success: true,
        message: 'Cash payment confirmed by vendor. Thank you!',
        transactionId: paymentId,
        timestamp: new Date()
      });
    }
    
    // Notify vendor about completed sale
    socket.emit('sale-completed', {
      cart: cart,
      totalAmount: totalAmount,
      paymentMethod: 'CASH',
      paymentId: paymentId,
      timestamp: new Date()
    });
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

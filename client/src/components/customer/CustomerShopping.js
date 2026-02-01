import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, CreditCard, Edit2, Check, X, Smartphone, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import StepIndicator from '../common/StepIndicator';
import SpeakButton from '../common/SpeakButton';
import CustomMessagePanel from '../common/CustomMessagePanel';
import CustomerFeedbackPopup from './CustomerFeedbackPopup';
import NotificationPopup from '../common/NotificationPopup';

const CustomerShopping = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [negotiations, setNegotiations] = useState({});
  const [negotiationRounds, setNegotiationRounds] = useState({});
  const [paymentMethod, setPaymentMethod] = useState(''); // Don't autoselect any payment method
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, pending, completed
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(null); // NEW: Control feedback popup
  const [pendingVendorResponses, setPendingVendorResponses] = useState([]); // NEW: Track vendor responses
  const [showNotificationPopup, setShowNotificationPopup] = useState(null); // NEW: Control notification popup
  const [showCashConfirmation, setShowCashConfirmation] = useState(false); // NEW: Control cash payment confirmation
  const { socket, session, language, proposePrice, role } = useSocket();
  const { t } = useTranslation();

  // Function to translate product names
  const translateProductName = (productName) => {
    const normalizedName = productName.toLowerCase().replace(/\s+/g, '');
    const translationKey = normalizedName;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original name
    return translated === translationKey ? productName : translated;
  };

  useEffect(() => {
    if (socket) {
      socket.on('inventory-updated', (data) => {
        console.log('✓ Inventory received:', data.products.length, 'products');
        setProducts(data.products);
      });

      socket.on('negotiation-update', (data) => {
        const { negotiation, result } = data;
        console.log('✓ Negotiation update received:', result.action, result);
        console.log('📥 Full negotiation data:', negotiation);
        console.log('📥 Full result data:', result);
        
        // Handle AI counter-offer with popup
        if (result.action === 'ai_counter_offer') {
          console.log('🤖 AI counter-offer received, showing popup');
          
          setShowNotificationPopup({
            type: 'info',
            title: t('vendorCounterOfferTitle') || 'Vendor Counter-Offer',
            message: result.message, // AI message is already translated by server
            showBackButton: true,
            showMessageButton: true
          });
          
          // Update negotiation state - KEEP allowing negotiation unless limit exceeded
          setNegotiations(prev => ({
            ...prev,
            [negotiation.productId]: {
              ...negotiation,
              ...result,
              status: 'ai_counter_offer',
              allowContinueNegotiation: result.allowContinueNegotiation !== false
            }
          }));
          return;
        }

        // Handle negotiation limit exceeded
        if (result.action === 'negotiation_limit_exceeded') {
          console.log('🚫 Negotiation limit exceeded, showing popup');
          setShowNotificationPopup({
            type: 'warning',
            title: t('negotiationLimitTitle'),
            message: result.message, // AI message is already translated by server
            showBackButton: true,
            showMessageButton: true
          });
          
          // Update negotiation state - STOP allowing negotiation
          setNegotiations(prev => ({
            ...prev,
            [negotiation.productId]: {
              ...negotiation,
              ...result,
              status: 'negotiation_limit_exceeded',
              allowContinueNegotiation: false
            }
          }));
          return;
        }

        // Handle final offer with popup
        if (result.action === 'final_offer') {
          console.log('🏁 Final offer received, showing popup');
          setShowNotificationPopup({
            type: 'warning',
            title: t('finalOffer'),
            message: result.message,
            showBackButton: true,
            showMessageButton: true
          });
          
          // Update negotiation state
          setNegotiations(prev => ({
            ...prev,
            [negotiation.productId]: {
              ...negotiation,
              ...result,
              status: 'final_offer'
            }
          }));
          return;
        }
        
        // Handle below floor price case with popup
        if (result.action === 'below_floor') {
          console.log('🚨 Below floor price detected, showing popup');
          
          const popupData = {
            type: 'warning',
            title: t('priceTooLowTitle'),
            message: result.message || t('priceTooLowMessage'), // Use server message first, fallback to translation
            showBackButton: true,
            showMessageButton: true
          };
          
          setShowNotificationPopup(popupData);
          
          // Also update negotiation state to show the below floor status
          setNegotiations(prev => ({
            ...prev,
            [negotiation.productId]: {
              ...negotiation,
              ...result,
              status: 'below_floor'
            }
          }));
          return;
        }

        // Handle pending vendor approval
        if (result.action === 'pending_vendor_approval') {
          console.log('⏳ Waiting for vendor approval...');
          // Show waiting message or update UI to indicate pending approval
          setNegotiations(prev => ({
            ...prev,
            [negotiation.productId]: {
              ...negotiation,
              ...result,
              status: 'pending_vendor_approval'
            }
          }));
          return;
        }
        
        setNegotiations(prev => ({
          ...prev,
          [negotiation.productId]: {
            ...negotiation,
            ...result
          }
        }));
      });

      // NEW: Handle vendor responses
      socket.on('vendor-response-received', (data) => {
        const { negotiation, response, product } = data;
        console.log('📨 Vendor response received:', response.action);
        
        // Handle acceptance - update cart item status
        if (response.action === 'accepted') {
          setCart(prev => prev.map(item => 
            item.productId === negotiation.productId 
              ? { ...item, agreedPrice: negotiation.customerOffer, status: 'accepted' }
              : item
          ));
          
          // Clear negotiation state
          setNegotiations(prev => {
            const updated = { ...prev };
            delete updated[negotiation.productId];
            return updated;
          });
          
          // Show feedback popup
          setShowFeedbackPopup({ negotiation, response, product });
          return;
        }
        
        // Handle rejection - update negotiation status and allow new proposals
        if (response.action === 'rejected') {
          // Update negotiation state to show rejected status
          setNegotiations(prev => ({
            ...prev,
            [negotiation.productId]: {
              ...negotiation,
              status: 'rejected',
              action: 'rejected',
              round: negotiation.round || 1
            }
          }));
          
          // Show notification popup
          setShowNotificationPopup({
            type: 'error',
            title: t('offerRejectedTitle'),
            message: t('offerRejectedMessage'),
            showBackButton: true,
            showMessageButton: true
          });
          return;
        }
        
        // Handle other responses with feedback popup
        setPendingVendorResponses(prev => [...prev, { negotiation, response, product }]);
        
        // Auto-show feedback popup for the first response
        if (!showFeedbackPopup) {
          setShowFeedbackPopup({ negotiation, response, product });
        }
      });

      // NEW: Handle price acceptance
      socket.on('price-accepted', (data) => {
        const { productId, agreedPrice, negotiationId } = data;
        console.log('✅ Price accepted:', { productId, agreedPrice });
        
        // Update cart with agreed price
        setCart(prev => prev.map(item => 
          item.productId === productId 
            ? { ...item, agreedPrice: agreedPrice, status: 'accepted' }
            : item
        ));

        // Clear negotiation state
        setNegotiations(prev => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
      });

      socket.on('negotiation-response', (data) => {
        const { negotiation, response, finalPrice } = data;
        console.log('✓ Vendor response:', response);
        
        setNegotiations(prev => ({
          ...prev,
          [negotiation.productId]: {
            ...negotiation,
            status: response,
            finalPrice
          }
        }));

        if (response === 'accepted' || response === 'final_offer') {
          setCart(prev => prev.map(item => 
            item.productId === negotiation.productId
              ? { ...item, agreedPrice: finalPrice, status: response }
              : item
          ));
        }
      });

      socket.on('cart-error', (data) => {
        setShowNotificationPopup({
          type: 'error',
          title: t('stockAlertTitle'),
          message: data.message,
          showBackButton: true,
          showMessageButton: false
        });
        console.error('Cart validation error:', data);
      });

      socket.on('stock-reduced', (data) => {
        const { productId, productName, newStock, currentCartQuantity } = data;
        setShowNotificationPopup({
          type: 'warning',
          title: t('stockAlertTitle'),
          message: `${productName} stock reduced to ${newStock}kg. You have ${currentCartQuantity}kg in cart. Please adjust your quantity.`,
          showBackButton: true,
          showMessageButton: false
        });
        
        setCart(prev => prev.map(item => 
          item.productId === productId && item.quantity > newStock
            ? { ...item, quantity: newStock }
            : item
        ));
      });

      socket.on('payment-confirmed', (data) => {
        console.log('✅ Payment confirmed:', data);
        if (data.success) {
          setShowNotificationPopup({
            type: 'success',
            title: t('paymentSuccessful'),
            message: `${t('transactionCompleted')} ID: ${data.transactionId}`,
            showBackButton: true,
            showMessageButton: false
          });
          setCart([]);
          setPaymentStatus('completed');
        }
      });

      socket.on('payment-pending', (data) => {
        console.log('⏳ Payment pending:', data);
        setPaymentStatus('pending');
        setShowNotificationPopup({
          type: 'info',
          title: t('paymentPending'),
          message: data.message,
          showBackButton: true,
          showMessageButton: false
        });
      });

      socket.on('payment-error', (data) => {
        console.error('❌ Payment error:', data);
        setShowNotificationPopup({
          type: 'error',
          title: t('paymentError'),
          message: data.message,
          showBackButton: true,
          showMessageButton: false
        });
        setPaymentStatus('idle');
      });

      return () => {
        socket.off('inventory-updated');
        socket.off('negotiation-update');
        socket.off('negotiation-response');
        socket.off('cart-error');
        socket.off('stock-reduced');
        socket.off('payment-confirmed');
        socket.off('payment-pending');
        socket.off('payment-redirect');
        socket.off('payment-error');
        socket.off('vendor-response-received');
        socket.off('price-accepted');
      };
    }
  }, [socket]);

  useEffect(() => {
    if (socket && session?.status === 'active' && session?.id) {
      console.log('✓ Requesting products for session:', session.id);
      socket.emit('get-products', { sessionId: session.id });
    }
  }, [socket, session]);

  useEffect(() => {
    if (socket && session?.id && cart.length >= 0) {
      socket.emit('cart-updated', {
        sessionId: session.id,
        cart: cart
      });
    }
  }, [cart, socket, session]);

  const addToCart = (product, quantity) => {
    if (quantity <= 0) return;

    const availableStock = product.quantity;
    const currentCartItem = cart.find(item => item.productId === product.id);
    const currentCartQuantity = currentCartItem ? currentCartItem.quantity : 0;
    const totalRequestedQuantity = currentCartQuantity + quantity;

    if (totalRequestedQuantity > availableStock) {
      alert(`${t('cannotAddQuantity')} ${quantity}kg. ${t('onlyAvailable')} ${availableStock}kg ${t('availableAndYouHave')} ${currentCartQuantity}kg ${t('inCart')}.`);
      return;
    }

    const cartItem = {
      productId: product.id,
      name: translateProductName(product.name),
      image: product.image,
      quantity,
      originalPrice: product.vendorPrice,
      agreedPrice: product.vendorPrice,
      status: 'added'
    };

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, cartItem];
    });

    if (socket && session?.id) {
      socket.emit('cart-item-added', {
        sessionId: session.id,
        item: cartItem
      });
    }
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
    setNegotiations(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });

    if (socket && session?.id) {
      socket.emit('cart-item-removed', {
        sessionId: session.id,
        productId
      });
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.quantity) {
      alert(`${t('cannotSetQuantity')} ${newQuantity}kg. ${t('onlyAvailable')} ${product.quantity}kg ${t('available')}.`);
      return;
    }

    setCart(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: parseFloat(newQuantity.toFixed(2)) }
        : item
    ));

    if (socket && session?.id) {
      socket.emit('cart-quantity-changed', {
        sessionId: session.id,
        productId,
        newQuantity: parseFloat(newQuantity.toFixed(2))
      });
    }
  };

  const handlePriceNegotiation = (productId, proposedPrice) => {
    const currentRound = negotiationRounds[productId] || 0;
    const newRound = currentRound + 1;
    
    // Check if negotiation limit exceeded (3 rounds max)
    if (newRound > 3) {
      setShowNotificationPopup({
        type: 'warning',
        title: t('negotiationLimitTitle'),
        message: t('negotiationLimitMessage'),
        showBackButton: true,
        showMessageButton: true
      });
      return;
    }
    
    setNegotiationRounds(prev => ({
      ...prev,
      [productId]: newRound
    }));

    const product = products.find(p => p.id === productId);
    proposePrice(productId, proposedPrice, newRound, product?.marketPrice || proposedPrice,language);
    
    setNegotiations(prev => ({
      ...prev,
      [productId]: {
        productId,
        proposedPrice,
        round: newRound,
        status: 'pending'
      }
    }));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.agreedPrice * item.quantity);
    }, 0);
  };


  // NEW: Handle feedback popup actions
  const handleFeedbackBack = () => {
    setShowFeedbackPopup(null);
    
    // Show next pending response if any
    const nextResponse = pendingVendorResponses.find(response => 
      !showFeedbackPopup || response.negotiation.id !== showFeedbackPopup.negotiation.id
    );
    
    if (nextResponse) {
      setShowFeedbackPopup(nextResponse);
    }
  };

  const handleFeedbackSendMessage = (message) => {
    if (socket && session?.id && showFeedbackPopup) {
      // Send custom message to vendor
      socket.emit('send-custom-message', {
        sessionId: session.id,
        message: message,
        fromRole: 'customer',
        toRole: 'vendor'
      });
      
      console.log('📤 Custom message sent to vendor:', message);
    }
  };

  const handleFeedbackPopupClose = () => {
    setShowFeedbackPopup(null);
    
    // Remove from pending responses
    if (showFeedbackPopup) {
      setPendingVendorResponses(prev => 
        prev.filter(response => response.negotiation.id !== showFeedbackPopup.negotiation.id)
      );
    }
    
    // Show next pending response if any
    const nextResponse = pendingVendorResponses.find(response => 
      !showFeedbackPopup || response.negotiation.id !== showFeedbackPopup.negotiation.id
    );
    
    if (nextResponse) {
      setShowFeedbackPopup(nextResponse);
    }
  };

  // NEW: Handle notification popup actions
  const handleNotificationClose = () => {
    setShowNotificationPopup(null);
  };

  const handleNotificationSendMessage = (message) => {
    setShowNotificationPopup(null);
    
    // If message is provided (from voice input), send it directly
    if (message && typeof message === 'string' && message.trim()) {
      console.log('📤 Sending message from notification popup:', message);
      if (socket && session?.id) {
        // Determine recipient language based on session data
        const recipientLanguage = role === 'vendor' 
          ? session.customerLanguage || 'en'  // If I'm vendor, send to customer's language
          : session.vendorLanguage || 'en';   // If I'm customer, send to vendor's language
        
        console.log(`🎯 Sending to recipient language: ${recipientLanguage}`);
        
        socket.emit('send-custom-message', {
          sessionId: session.id,
          message: message.trim(),
          senderRole: role,
          senderLanguage: language,
          recipientLanguage: recipientLanguage
        });
      } else {
        console.error('❌ Missing session or socket info');
      }
    } else {
      // If no message provided, open the custom message panel
      console.log('📝 Opening custom message panel');
      const messagePanel = document.querySelector('[data-message-panel]');
      if (messagePanel) {
        messagePanel.click();
      }
    }
  };

  // NEW: Handle cash payment confirmation
  const handleCashPaymentConfirm = () => {
    const total = calculateTotal();
    setShowCashConfirmation(false);
    console.log('💰 Initiating cash payment:', { sessionId: session.id, total, cart });
    setPaymentStatus('processing');
    socket.emit('process-payment', {
      sessionId: session.id,
      cart: cart,
      totalAmount: total,
      paymentMethod: 'CASH'
    });
  };

  const handleCashPaymentCancel = () => {
    setShowCashConfirmation(false);
  };

  const handlePayment = async () => {
    const total = calculateTotal();
    
    if (!socket || !session?.id) {
      setShowNotificationPopup({
        type: 'error',
        title: t('connectionErrorTitle'),
        message: t('connectionErrorMessage'),
        showBackButton: true,
        showMessageButton: false
      });
      return;
    }
    
    if (cart.length === 0) {
      setShowNotificationPopup({
        type: 'warning',
        title: t('emptyCart'),
        message: t('emptyCartMessage'),
        showBackButton: true,
        showMessageButton: false
      });
      return;
    }
    
    if (paymentMethod === 'CASH') {
      setShowCashConfirmation(true);
    } else if (paymentMethod === 'UPI') {
      try {
        console.log('💳 Initiating UPI payment:', { sessionId: session.id, total, cart });
        setPaymentStatus('processing');
        
        const orderResponse = await fetch('http://localhost:5000/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            sessionId: session.id,
            cart: cart
          })
        });
        
        if (!orderResponse.ok) {
          throw new Error(`HTTP ${orderResponse.status}: ${orderResponse.statusText}`);
        }
        
        const orderData = await orderResponse.json();
        console.log('✓ Razorpay order created:', orderData);
        
        if (!orderData.success) {
          throw new Error(orderData.message || 'Failed to create payment order');
        }
        
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK not loaded. Please refresh the page.');
        }
        
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Multilingual Mandi',
          description: `Purchase from ${session.id}`,
          order_id: orderData.order_id,
          method: {     
            card: true,
            netbanking: false,
            wallet: true
          },

          handler: async function (response) {
            try {
              console.log('✓ Payment completed, verifying:', response);
              const verifyResponse = await fetch('http://localhost:5000/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  sessionId: session.id,
                  cart: cart,
                  totalAmount: total
                })
              });
              
              if (!verifyResponse.ok) {
                throw new Error(`Verification failed: ${verifyResponse.status}`);
              }
              
              const verifyData = await verifyResponse.json();
              console.log('✓ Payment verification result:', verifyData);
              
              if (verifyData.success) {
                alert(`${t('paymentSuccessful')}\n${t('transactionId')}: ${verifyData.transaction_id || response.razorpay_payment_id}`);
                setCart([]);
                setPaymentStatus('completed');
              } else {
                throw new Error(verifyData.message || t('paymentVerificationFailed'));
              }
            } catch (error) {
              console.error('❌ Payment verification error:', error);
              alert(`${t('paymentVerificationFailed')}: ${error.message}`);
              setPaymentStatus('idle');
            }
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com',
            contact: '9999999999'
          },
          theme: {
            color: '#3B82F6'
          },
          modal: {
            ondismiss: function() {
              console.log('Payment modal dismissed');
              setPaymentStatus('idle');
            }
          }
        };
        
        console.log('🚀 Opening Razorpay modal with options:', options);
        const rzp = new window.Razorpay(options);
        rzp.open();
        
      } catch (error) {
        console.error('❌ Payment error:', error);
        alert(`${t('paymentError')}: ${error.message}`);
        setPaymentStatus('idle');
      }
    }
  };

  return (
    <div className="min-h-screen bg-bharat-background p-4">
      <div className="max-w-7xl mx-auto">
        <StepIndicator currentStep="negotiation" role="customer" />
        
        <div className="grid grid-cols-12 gap-6">
          {/* Column 1: Available Products (Broader - 6 columns) */}
          <div className="col-span-6 bg-white rounded-xl shadow-lg border border-bharat-border p-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <h2 className="text-xl font-bold text-bharat-primary text-center">
                {t('availableProducts')}
              </h2>
              <SpeakButton 
                text={t('availableProducts')} 
                language={language} 
                size="md"
              />
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 text-bharat-muted">
                <p className="text-lg mb-2">{t('noProductsAvailable')}</p>
                <p className="text-sm">{t('waitingForVendorProducts')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Shopping Cart (Narrower - 3 columns) */}
          <div className="col-span-3 bg-white rounded-xl shadow-lg border border-bharat-border p-6">
            {/* Pending Vendor Responses Notification */}
            {pendingVendorResponses.length > 0 && !showFeedbackPopup && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-800 text-sm font-medium">
                      {pendingVendorResponses.length} {t('vendorResponsesReceived')}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFeedbackPopup(pendingVendorResponses[0])}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    {t('view')}
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-3 mb-6">
              <ShoppingCart className="w-6 h-6 text-bharat-primary" />
              <h3 className="text-xl font-semibold text-bharat-primary text-center">
                {t('shoppingCart')}
              </h3>
            </div>

            {/* Negotiation Limit Info */}
            <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <p className="text-black text-xs text-center">
                  {t('negotiationLimitInfo')}
                </p>
                <div onClick={(e) => e.stopPropagation()}>
                  <SpeakButton 
                    text={t('negotiationLimitInfo')} 
                    language={language} 
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-bharat-muted">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">{t('cartIsEmpty')}</p>
                <p className="text-sm">{t('addItemsToCart')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    negotiation={negotiations[item.productId]}
                    onUpdateQuantity={updateCartQuantity}
                    onRemove={removeFromCart}
                    onNegotiate={handlePriceNegotiation}
                    negotiationRound={negotiationRounds[item.productId] || 0}
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Order Summary & Checkout (Narrower - 3 columns) */}
          <div className="col-span-3 bg-white rounded-xl shadow-lg border border-bharat-border p-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <CreditCard className="w-6 h-6 text-bharat-primary" />
              <h3 className="text-xl font-semibold text-bharat-primary text-center">
                {t('orderSummary')}
              </h3>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-bharat-muted">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">{t('noItemsToCheckout')}</p>
                <p className="text-sm">{t('addItemsToSeeSummary')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-bharat-primary border-b border-bharat-border pb-2">
                    {t('orderItems')}
                  </h4>
                  {cart.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center py-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-bharat-muted">
                          ₹{item.agreedPrice} × {item.quantity}kg
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-bharat-primary">
                          ₹{(item.agreedPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-bharat-border pt-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-semibold text-bharat-primary">Total:</span>
                    <span className="text-2xl font-bold text-bharat-primary">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method Selection - Single Line, Small */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-bharat-primary border-b border-bharat-border pb-2">
                    {t('paymentMethod')}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('UPI')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border-2 transition-colors text-sm ${
                        paymentMethod === 'UPI'
                          ? 'border-bharat-primary bg-bharat-primary bg-opacity-10 text-bharat-primary'
                          : 'border-bharat-border text-bharat-muted hover:border-bharat-primary'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="font-medium">{t('upi')}</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border-2 transition-colors text-sm ${
                        paymentMethod === 'CASH'
                          ? 'border-bharat-primary bg-bharat-primary bg-opacity-10 text-bharat-primary'
                          : 'border-bharat-border text-bharat-muted hover:border-bharat-primary'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span className="font-medium">{t('cash')}</span>
                    </button>
                  </div>
                </div>

                {/* Payment Status */}
                {paymentStatus === 'pending' && (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 text-center font-medium">
                      ⏳ {t('waitingVendorConfirmation')}
                    </p>
                  </div>
                )}

                {paymentStatus === 'processing' && (
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 text-center font-medium">
                      🔄 {t('processingPayment')}
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                {paymentMethod && (
                  <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'processing' || paymentStatus === 'pending'}
                    className={`w-full flex items-center justify-center py-3 rounded-lg transition-colors font-medium text-sm ${
                      paymentStatus === 'processing' || paymentStatus === 'pending'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : paymentMethod === 'UPI'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {paymentMethod === 'UPI' ? (
                      <span>{t('payViaUPI')} ₹{calculateTotal().toFixed(2)}</span>
                    ) : (
                      <span>{t('payInCash')} ₹{calculateTotal().toFixed(2)}</span>
                    )}
                  </button>
                )}

                {!paymentMethod && (
                  <div className="text-center py-4 text-bharat-muted">
                    <p className="text-sm">{t('selectPaymentMethod')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <CustomMessagePanel />

      {/* Customer Feedback Popup */}
      {showFeedbackPopup && (
        <CustomerFeedbackPopup
          negotiationResponse={showFeedbackPopup}
          product={showFeedbackPopup.product}
          onBack={handleFeedbackBack}
          onSendMessage={handleFeedbackSendMessage}
          onClose={handleFeedbackPopupClose}
        />
      )}

      {/* Notification Popup */}
      {showNotificationPopup && (
        <NotificationPopup
          isOpen={true}
          onClose={handleNotificationClose}
          type={showNotificationPopup.type}
          title={showNotificationPopup.title}
          message={showNotificationPopup.message}
          showBackButton={showNotificationPopup.showBackButton}
          showMessageButton={showNotificationPopup.showMessageButton}
          onSendMessage={showNotificationPopup.showMessageButton ? handleNotificationSendMessage : null}
        />
      )}

      {/* Cash Payment Confirmation */}
      {showCashConfirmation && (
        <NotificationPopup
          isOpen={true}
          onClose={handleCashPaymentCancel}
          type="info"
          title={t('confirmCashPayment')}
          message={`${t('cash')} ${t('paymentMethod')}: ₹${calculateTotal().toFixed(2)}\n\nThis will notify the vendor to confirm your cash payment.`}
          showBackButton={false}
          showMessageButton={false}
          customActions={
            <div className="flex space-x-3">
              <button
                onClick={handleCashPaymentConfirm}
                className="flex-1 bg-bharat-success text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {t('proceed')}
              </button>
              <button
                onClick={handleCashPaymentCancel}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                {t('cancel')}
              </button>
            </div>
          }
        />
      )}
    </div>
  );
};

// FIXED Product Card Component - NO MORE BLINKING!
const ProductCard = ({ product, onAddToCart, language, t }) => {
  const [quantity, setQuantity] = useState(0.5);
  const [pendingQuantityChange, setPendingQuantityChange] = useState(undefined);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  
  const API_BASE_URL = 'http://localhost:5000';

  // Function to translate product names
  const translateProductName = (productName) => {
    const normalizedName = productName.toLowerCase().replace(/\s+/g, '');
    const translationKey = normalizedName;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original name
    return translated === translationKey ? productName : translated;
  };

  const handleQuantityChange = (value) => {
    // Exactly like stock field: allow empty string and numbers with decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setPendingQuantityChange(value); // Store the raw string value
        setIsEditingQuantity(true);
      }
    }
  };

  const handleQuantitySave = () => {
    const newQuantity = pendingQuantityChange; // Use the raw pending value
    if (newQuantity !== undefined) {
      const numValue = parseFloat(newQuantity) || 0;
      const maxQuantity = Math.min(product.quantity, numValue);
      const finalQuantity = Math.max(0, maxQuantity);
      
      setQuantity(finalQuantity);
      setPendingQuantityChange(undefined);
      setIsEditingQuantity(false);
      
      console.log(`✓ Quantity saved: ${finalQuantity}kg for ${product.name}`);
    }
  };

  const handleQuantityBlur = (e) => {
    // Exactly like stock field: clean up value on blur
    const value = e.target.value;
    const numValue = parseFloat(value) || 0; // Convert empty to 0
    setPendingQuantityChange(numValue.toString());
  };

  // CRITICAL FIX: Proper image error handling with fallback
  const handleImageError = (e) => {
    // Prevent infinite loop - only try fallback once
    if (imageAttempt >= 1) {
      console.error(`❌ All image attempts failed for ${product.name}`);
      return; // Stop after default.png fails
    }

    console.log(`⚠️ Image load failed for ${product.name}, trying default.png`);
    setImageAttempt(1);
    
    // Try the default image for this category
    e.target.src = `${API_BASE_URL}/static/${product.category}/default.png`;
  };

  const getImageUrl = () => {
    // If we've already tried and failed, use default
    if (imageAttempt >= 1) {
      return `${API_BASE_URL}/static/${product.category}/default.png`;
    }
    
    // First attempt: try the product's specific image
    if (product.image) {
      // If the image already has a full URL, use it
      if (product.image.startsWith('http')) {
        return product.image;
      }
      // If it's a path, prepend the API base URL
      return `${API_BASE_URL}${product.image}`;
    }
    
    // Fallback: construct from category and name
    const imageName = product.name.toLowerCase().replace(/\s+/g, '-');
    return `${API_BASE_URL}/static/${product.category}/${imageName}.png`;
  };

  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity < 1;
  const imageUrl = getImageUrl();
  
  // Check if add to cart should be disabled
  const isAddToCartDisabled = quantity <= 0 || quantity > product.quantity;

  return (
    <div className={`border border-bharat-border rounded-lg p-4 hover:shadow-md transition-shadow ${isOutOfStock ? 'opacity-60' : ''}`}>
      <div className="flex flex-col space-y-4">
        {/* Product Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-bharat-background border border-bharat-border flex-shrink-0">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-bharat-primary">
                {translateProductName(product.name)}
              </h4>
              <SpeakButton 
                text={translateProductName(product.name)} 
                language={language} 
                size="sm"
              />
            </div>
            <div className="space-y-1">
              <p className="text-bharat-primary font-semibold">
                ₹{product.vendorPrice}{t('perKg')}
              </p>
              <span className={`inline-block text-xs px-2 py-1 rounded ${
                isOutOfStock ? 'bg-red-100 text-red-800' :
                isLowStock ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {isOutOfStock ? t('currentlyUnavailable') : 
                 isLowStock ? `${t('lowStock')}: ${product.quantity}kg` :
                 `${product.quantity}kg ${t('available')}`}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quantity & Add to Cart */}
        {!isOutOfStock && (
          <div className="flex items-center justify-between pt-2 border-t border-bharat-border">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-bharat-muted">{t('quantity')}:</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={pendingQuantityChange !== undefined ? pendingQuantityChange : quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={handleQuantityBlur}
                className={`w-16 text-center border-2 rounded-lg py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent transition-colors ${
                  pendingQuantityChange !== undefined 
                    ? 'border-orange-400 bg-orange-50 text-bharat-primary' 
                    : 'border-bharat-border text-bharat-primary'
                }`}
                placeholder="0"
              />
              <span className="text-sm text-bharat-muted">{t('kg')}</span>
              
              <button
                onClick={handleQuantitySave}
                className={`p-2 rounded-lg transition-colors shadow-sm ${
                  isEditingQuantity && pendingQuantityChange !== undefined
                    ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-100 text-gray-400'
                }`}
                title="Save quantity"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => onAddToCart(product, quantity)}
              disabled={isAddToCartDisabled}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isAddToCartDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-bharat-primary text-white hover:bg-opacity-90'
              }`}
            >
              {t('addToCart')}
            </button>
          </div>
        )}
        
        {isOutOfStock && (
          <div className="text-center py-3 border-t border-bharat-border">
            <span className="text-red-600 text-sm font-medium">{t('currentlyUnavailable')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Cart Item Component with Editable Quantity
const CartItem = ({ 
  item, 
  negotiation, 
  onUpdateQuantity, 
  onRemove, 
  onNegotiate, 
  negotiationRound,
  language, 
  t 
}) => {
  const [proposedPrice, setProposedPrice] = useState(item.originalPrice);
  const [pendingPriceChange, setPendingPriceChange] = useState(undefined);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [pendingQuantityChange, setPendingQuantityChange] = useState(undefined);

  // CRITICAL: Always use the current item.quantity, not a stale editQuantity state
  const currentQuantity = item.quantity;
  const currentPrice = item.originalPrice;

  const canNegotiate = negotiationRound < 3 && 
    item.status !== 'accepted' &&
    (!negotiation || 
     negotiation.status === 'rejected' || 
     negotiation.action === 'below_floor' ||
     negotiation.action === 'rejected' ||
     negotiation.status === 'ai_counter_offer' ||
     (negotiation.allowContinueNegotiation !== false));

  const showFinalOffer = negotiation?.status === 'final_offer';
  const showBelowFloor = negotiation?.action === 'below_floor';

  // Reset proposed price when negotiation fails due to below floor
  React.useEffect(() => {
    if (negotiation?.action === 'below_floor') {
      setProposedPrice(item.originalPrice);
      setPendingPriceChange(undefined);
      setIsEditingPrice(false);
    }
  }, [negotiation?.action, item.originalPrice]);

  const handleQuantitySave = () => {
    const newQuantity = pendingQuantityChange;
    if (newQuantity !== undefined) {
      const numValue = parseFloat(newQuantity) || 0;
      if (numValue > 0) {
        onUpdateQuantity(item.productId, parseFloat(numValue.toFixed(2)));
      }
    }
    setIsEditingQuantity(false);
    setPendingQuantityChange(undefined);
  };

  const handleQuantityCancel = () => {
    setIsEditingQuantity(false);
    setPendingQuantityChange(undefined);
  };

  const handleQuantityChange = (value) => {
    // Exactly like stock field: allow empty string and numbers with decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setPendingQuantityChange(value);
        setIsEditingQuantity(true);
      }
    }
  };

  const handleQuantityBlur = (e) => {
    // Exactly like stock field: clean up value on blur
    const value = e.target.value;
    const numValue = parseFloat(value) || 0;
    setPendingQuantityChange(numValue.toString());
  };

  // Price handling functions - different from quantity (never allow 0)
  const handlePriceSave = () => {
    const newPrice = pendingPriceChange;
    if (newPrice !== undefined) {
      const numValue = parseFloat(newPrice);
      if (isNaN(numValue) || numValue <= 0) {
        // If invalid or 0, keep original price
        setProposedPrice(item.originalPrice);
      } else {
        setProposedPrice(numValue);
      }
      console.log(`✓ Price saved: ₹${proposedPrice} for ${item.name}`);
    }
    setIsEditingPrice(false);
    setPendingPriceChange(undefined);
  };

  const handlePriceCancel = () => {
    setIsEditingPrice(false);
    setPendingPriceChange(undefined);
  };

  const handlePriceChange = (value) => {
    // Allow editing but validate for positive numbers only
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setPendingPriceChange(value);
        setIsEditingPrice(true);
      }
    }
  };

  const handlePriceBlur = (e) => {
    // Different from quantity: never allow 0, always fallback to original price
    const value = e.target.value;
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      // If invalid or 0, revert to original price
      setPendingPriceChange(item.originalPrice.toString());
    } else {
      setPendingPriceChange(numValue.toString());
    }
  };

  return (
    <div className="border border-bharat-border rounded-lg p-3">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h4 className="font-medium text-bharat-primary truncate mb-1">
                {item.name}
              </h4>
              {/* Round display and FIXED badge - below product name */}
              <div className="flex items-center space-x-2">
                {negotiationRound > 0 && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                    R{negotiationRound}
                  </span>
                )}
                {/* FIXED badge for accepted offers OR exhausted negotiations */}
                {(item.status === 'accepted' || (negotiationRound >= 3)) && (
                  <span className="inline-block bg-bharat-primary text-white text-xs px-1.5 py-0.5 rounded font-medium" style={{ fontSize: '10px' }}>
                    FIXED
                  </span>
                )}
              </div>
            </div>
            
            {/* Editable Quantity - Compact */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs text-bharat-muted">{t('quantity')}:</span>
              {!isEditingQuantity ? (
                <>
                  <span className="text-sm font-medium">{currentQuantity} {t('kg')}</span>
                  <button
                    onClick={() => setIsEditingQuantity(true)}
                    className="p-1 hover:bg-bharat-background rounded"
                    title="Edit quantity"
                  >
                    <Edit2 className="w-3 h-3 text-bharat-primary" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={pendingQuantityChange !== undefined ? pendingQuantityChange : currentQuantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onBlur={handleQuantityBlur}
                    className={`w-12 text-center border rounded py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-bharat-primary transition-colors ${
                      pendingQuantityChange !== undefined 
                        ? 'border-orange-400 bg-orange-50 text-bharat-primary' 
                        : 'border-bharat-border text-bharat-primary'
                    }`}
                    placeholder="0"
                    autoFocus
                  />
                  <span className="text-xs text-bharat-muted">{t('kg')}</span>
                  <button
                    onClick={handleQuantitySave}
                    className={`p-1 rounded transition-colors ${
                      pendingQuantityChange !== undefined
                        ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title="Save quantity"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleQuantityCancel}
                    className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Price Info - Compact */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-bharat-muted">{t('original')}:</span>
                <span>₹{item.originalPrice}{t('perKg')}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-bharat-muted">{t('current')}:</span>
                <span>₹{item.agreedPrice}{t('perKg')}</span>
              </div>
              <div className="flex justify-between font-semibold text-bharat-primary">
                <span>{t('subtotal')}:</span>
                <span>₹{(item.agreedPrice * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onRemove(item.productId)}
            className="text-red-600 hover:text-red-800 text-xs ml-2 flex-shrink-0"
          >
            {t('remove')}
          </button>
        </div>

        {/* Negotiation - Compact and Contained - Hide if FINAL */}
        {canNegotiate && item.status !== 'accepted' && negotiationRound < 3 && (
          <div className="p-2 bg-bharat-background rounded border">
            <p className="text-xs text-bharat-muted mb-2">
              {t('proposeBetterPrice')}:
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs text-bharat-muted">₹</span>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={pendingPriceChange !== undefined ? pendingPriceChange : proposedPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                onBlur={handlePriceBlur}
                className={`w-16 text-center border-2 rounded-lg py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent transition-colors ${
                  pendingPriceChange !== undefined 
                    ? 'border-orange-400 bg-orange-50 text-bharat-primary' 
                    : 'border-bharat-border text-bharat-primary'
                }`}
                placeholder="0"
              />
              <span className="text-xs text-bharat-muted">{t('perKg')}</span>
              
              <button
                onClick={handlePriceSave}
                className={`p-1 rounded-lg transition-colors shadow-sm ${
                  isEditingPrice && pendingPriceChange !== undefined
                    ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-100 text-gray-400'
                }`}
                title="Save price"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
            
            <button
              onClick={() => onNegotiate(item.productId, proposedPrice)}
              className="w-full px-2 py-1 bg-bharat-primary text-white rounded text-xs hover:bg-opacity-90"
            >
              {t('propose')}
            </button>
          </div>
        )}

        {/* Final Offer - Compact - Hide if FINAL */}
        {showFinalOffer && item.status !== 'accepted' && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-xs text-red-800 font-medium mb-1">
              {t('finalOffer')}: ₹{negotiation.finalPrice}{t('perKg')}
            </p>
            <p className="text-xs text-red-600 mb-2">
              {t('finalOfferTakeItOrLeave')}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => onUpdateQuantity(item.productId, item.quantity)}
                className="flex-1 px-2 py-1 bg-bharat-success text-white rounded text-xs"
              >
                {t('accept')}
              </button>
              <button
                onClick={() => onRemove(item.productId)}
                className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs"
              >
                {t('remove')}
              </button>
            </div>
          </div>
        )}

        {/* Negotiation Status - Compact - Hide if FINAL or rounds exhausted */}
        {negotiation && item.status !== 'accepted' && negotiationRound < 3 && (
          <div>
            <span className={`text-xs px-2 py-1 rounded ${
              negotiation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              negotiation.status === 'pending_vendor_approval' ? 'bg-blue-100 text-blue-800' :
              negotiation.status === 'ai_counter_offer' ? 'bg-green-100 text-green-800' :
              negotiation.status === 'negotiation_limit_exceeded' ? 'bg-red-100 text-red-800' :
              negotiation.status === 'final_offer' ? 'bg-red-100 text-red-800' :
              negotiation.status === 'accepted' ? 'bg-green-100 text-green-800' :
              negotiation.status === 'rejected' || negotiation.action === 'rejected' ? 'bg-red-100 text-red-800' :
              negotiation.action === 'below_floor' || negotiation.status === 'below_floor' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {negotiation.status === 'pending' ? t('negotiating') :
               negotiation.status === 'pending_vendor_approval' ? t('awaitingVendorApproval') :
               negotiation.status === 'ai_counter_offer' ? t('counterOfferReceived') :
               negotiation.status === 'negotiation_limit_exceeded' ? t('negotiationLimitExceededFixed') :
               negotiation.status === 'final_offer' ? t('finalOfferTakeOrLeave') :
               negotiation.status === 'accepted' ? t('priceAccepted') :
               negotiation.status === 'rejected' || negotiation.action === 'rejected' ? t('priceRejectedTryAgain') :
               negotiation.action === 'below_floor' || negotiation.status === 'below_floor' ? t('priceTooLowTryHigher') :
               t('finalOffer')}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerShopping;

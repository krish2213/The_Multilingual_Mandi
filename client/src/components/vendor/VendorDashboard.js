import { useState, useEffect } from 'react';
import { Copy, Users, Clock, CheckCircle, XCircle, ShoppingCart, TrendingUp, Package, Plus, Save, X, Edit, Banknote, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import StepIndicator from '../common/StepIndicator';
import SpeakButton from '../common/SpeakButton';
import CustomMessagePanel from '../common/CustomMessagePanel';
import VendorApprovalPopup from './VendorApprovalPopup';
import NotificationPopup from '../common/NotificationPopup';

const VendorDashboard = ({ products, onAddMoreProducts, onProductsUpdate }) => {
  const [negotiations, setNegotiations] = useState([]);
  const [customerCart, setCustomerCart] = useState([]);
  const [counterPrices, setCounterPrices] = useState({});
  const [localProducts, setLocalProducts] = useState(products || []);
  const [editingStock, setEditingStock] = useState({});
  const [pendingStockChanges, setPendingStockChanges] = useState({});
  const [editingPrice, setEditingPrice] = useState({});
  const [pendingPriceChanges, setPendingPriceChanges] = useState({});
  const [pendingCashPayments, setPendingCashPayments] = useState([]);
  const [showPaymentPopup, setShowPaymentPopup] = useState(null); // NEW: Control payment popup
  const [showCopySuccessPopup, setShowCopySuccessPopup] = useState(false); // NEW: Control copy success popup
  const [showSaleCompletedPopup, setShowSaleCompletedPopup] = useState(null); // NEW: Control sale completed popup
  const [imageAttempts, setImageAttempts] = useState({}); // ADDED: Track image load attempts
  const [pendingApprovals, setPendingApprovals] = useState([]); // NEW: Track pending approvals
  const [showApprovalPopup, setShowApprovalPopup] = useState(null); // NEW: Control approval popup
  const { socket, session, language, respondToNegotiation } = useSocket();
  const { t } = useTranslation();

  const API_BASE_URL = 'http://localhost:5000'; // ADDED: API base URL

  // Function to translate product names
  const translateProductName = (productName) => {
    const normalizedName = productName.toLowerCase().replace(/\s+/g, '');
    const translationKey = normalizedName;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original name
    return translated === translationKey ? productName : translated;
  };

  useEffect(() => {
    setLocalProducts(products || []);
  }, [products]);

  useEffect(() => {
    if (socket) {
      socket.on('price-proposed', (data) => {
        setNegotiations(prev => [...prev, data.negotiation]);
      });

      socket.on('customer-cart-updated', (data) => {
        setCustomerCart(data.cart);
      });

      socket.on('inventory-updated', (data) => {
        setLocalProducts(data.products);
        // Update parent state as well
        if (onProductsUpdate) {
          onProductsUpdate(data.products);
        }
      });

      socket.on('sale-completed', (data) => {
        const { cart, totalAmount, paymentMethod, timestamp } = data;
        // Translate product names to vendor's language
        const itemsList = cart.map(item => {
          const originalProduct = localProducts.find(p => p.id === item.productId);
          const displayName = originalProduct ? translateProductName(originalProduct.name) : item.name;
          return `${displayName} (${item.quantity}kg)`;
        }).join(', ');
        
        // Show popup instead of alert
        setShowSaleCompletedPopup({
          items: itemsList,
          total: totalAmount,
          paymentMethod: paymentMethod,
          timestamp: timestamp
        });
        
        console.log('✅ Sale completed:', data);
      });

      socket.on('cash-payment-pending', (data) => {
        console.log('💰 Cash payment pending:', data);
        setPendingCashPayments(prev => [...prev, data]);
        
        // Auto-show popup for the first pending payment
        if (!showPaymentPopup) {
          setShowPaymentPopup(data);
        }
      });

      // NEW: Handle vendor approval requests
      socket.on('vendor-approval-request', (data) => {
        console.log('🔔 Vendor approval request received:', data);
        setPendingApprovals(prev => [...prev, data]);
        
        // Auto-show popup for the first pending approval
        if (!showApprovalPopup) {
          setShowApprovalPopup(data);
        }
      });

      socket.on('approval-response-sent', (data) => {
        console.log('✅ Approval response sent:', data);
        // Remove from pending approvals
        setPendingApprovals(prev => 
          prev.filter(approval => approval.negotiation.id !== data.negotiationId)
        );
      });

      return () => {
        socket.off('price-proposed');
        socket.off('customer-cart-updated');
        socket.off('inventory-updated');
        socket.off('sale-completed');
        socket.off('cash-payment-pending');
        socket.off('vendor-approval-request');
        socket.off('approval-response-sent');
      };
    }
  }, [socket, showApprovalPopup]);

  const handleStockUpdate = (productId, newQuantity) => {
    setLocalProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, quantity: parseFloat(newQuantity) || 0 } : p
    ));
    
    setPendingStockChanges(prev => ({
      ...prev,
      [productId]: parseFloat(newQuantity) || 0
    }));
  };

  const handleStockSave = (productId) => {
    const newQuantity = pendingStockChanges[productId];
    if (newQuantity !== undefined && socket && session?.id) {
      socket.emit('vendor-stock-edit', {
        sessionId: session.id,
        productId: productId,
        newQuantity: newQuantity
      });
      
      setPendingStockChanges(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      
      setEditingStock(prev => ({
        ...prev,
        [productId]: false
      }));
      
      console.log(`✅ Stock saved: ${productId} → ${newQuantity}kg`);
    }
  };

  const handleStockCancel = (productId) => {
    const originalProduct = products.find(p => p.id === productId);
    if (originalProduct) {
      setLocalProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, quantity: originalProduct.quantity } : p
      ));
    }
    
    setPendingStockChanges(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
    
    setEditingStock(prev => ({
      ...prev,
      [productId]: false
    }));
  };

  // Handle price save
  const handlePriceSave = (productId) => {
    const newPrice = pendingPriceChanges[productId];
    if (newPrice !== undefined && socket && session?.id) {
      socket.emit('vendor-price-edit', {
        sessionId: session.id,
        productId: productId,
        newPrice: Number(newPrice)
      });
      
      // Clear editing state
      setPendingPriceChanges(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      setEditingPrice(prev => ({ ...prev, [productId]: false }));
      
      console.log(`✓ Price saved: ₹${newPrice} for product ${productId}`);
    }
  };

  const handleCashPaymentConfirm = (paymentData) => {
    console.log('💰 Confirming cash payment:', paymentData);
    
    if (!socket || !session?.id) {
      alert(t('connectionError'));
      return;
    }
    
    if (socket && session?.id) {
      socket.emit('confirm-cash-payment', {
        sessionId: session.id,
        paymentId: paymentData.paymentId,
        cart: paymentData.cart,
        totalAmount: paymentData.totalAmount
      });
      
      console.log('✓ Cash payment confirmation sent to server');
      
      setPendingCashPayments(prev => 
        prev.filter(p => p.paymentId !== paymentData.paymentId)
      );
      
      // Close current popup and show next if any
      setShowPaymentPopup(null);
      const nextPayment = pendingCashPayments.find(p => p.paymentId !== paymentData.paymentId);
      if (nextPayment) {
        setShowPaymentPopup(nextPayment);
      }
    }
  };

  const handleCashPaymentReject = (paymentData) => {
    setPendingCashPayments(prev => 
      prev.filter(p => p.paymentId !== paymentData.paymentId)
    );
    
    // Close current popup and show next if any
    setShowPaymentPopup(null);
    const nextPayment = pendingCashPayments.find(p => p.paymentId !== paymentData.paymentId);
    if (nextPayment) {
      setShowPaymentPopup(nextPayment);
    }
  };

  const handlePaymentPopupClose = () => {
    setShowPaymentPopup(null);
    
    // Show next pending payment if any
    const nextPayment = pendingCashPayments.find(payment => 
      !showPaymentPopup || payment.paymentId !== showPaymentPopup.paymentId
    );
    
    if (nextPayment) {
      setShowPaymentPopup(nextPayment);
    }
  };

  const handleNegotiationResponse = (negotiationId, response, customPrice = null) => {
    const negotiation = negotiations.find(n => n.id === negotiationId);
    if (!negotiation) return;

    const product = products.find(p => p.id === negotiation.productId);
    if (!product) return;

    let finalPrice = customPrice || negotiation.proposedPrice;
    
    if (response === 'reject') {
      const productNegotiations = negotiations.filter(n => n.productId === negotiation.productId);
      const rejectionCount = productNegotiations.filter(n => n.status === 'rejected').length;
      
      if (rejectionCount >= 1) {
        finalPrice = product.floorPrice;
        response = 'final_offer';
      }
    }

    respondToNegotiation(negotiationId, response, finalPrice);
    
    setNegotiations(prev => prev.map(n => 
      n.id === negotiationId 
        ? { ...n, status: response, finalPrice }
        : n
    ));
  };

  const calculateCartTotal = () => {
    return customerCart.reduce((total, item) => total + (item.agreedPrice * item.quantity), 0);
  };

  // ADDED: Image error handling function
  const handleImageError = (e, productId, category) => {
    const currentAttempt = imageAttempts[productId] || 0;
    
    if (currentAttempt >= 1) {
      console.error(`❌ All image attempts failed for product ${productId}`);
      return;
    }

    console.log(`⚠️ Image load failed for product ${productId}, trying default.png`);
    
    setImageAttempts(prev => ({
      ...prev,
      [productId]: 1
    }));
    
    e.target.src = `${API_BASE_URL}/static/${category}/default.png`;
  };

  // NEW: Handle vendor approval responses
  const handleApprovalAccept = (negotiationId, agreedPrice) => {
    if (socket && session?.id) {
      socket.emit('vendor-approval-response', {
        sessionId: session.id,
        negotiationId,
        response: 'accept'
      });
    }
  };

  const handleApprovalReject = (negotiationId) => {
    if (socket && session?.id) {
      socket.emit('vendor-approval-response', {
        sessionId: session.id,
        negotiationId,
        response: 'reject'
      });
    }
  };

  const handleApprovalCustomMessage = (negotiationId, customMessage) => {
    if (socket && session?.id) {
      socket.emit('vendor-approval-response', {
        sessionId: session.id,
        negotiationId,
        response: 'custom_message',
        customMessage
      });
    }
  };

  const handleApprovalPopupClose = () => {
    setShowApprovalPopup(null);
    
    // Show next pending approval if any
    const nextApproval = pendingApprovals.find(approval => 
      !showApprovalPopup || approval.negotiation.id !== showApprovalPopup.negotiation.id
    );
    
    if (nextApproval) {
      setShowApprovalPopup(nextApproval);
    }
  };

  // ADDED: Get image URL function
  const getImageUrl = (product) => {
    const attempt = imageAttempts[product.id] || 0;
    
    if (attempt >= 1) {
      return `${API_BASE_URL}/static/${product.category}/default.png`;
    }
    
    if (product.image) {
      if (product.image.startsWith('http')) {
        return product.image;
      }
      return `${API_BASE_URL}${product.image}`;
    }
    
    const imageName = product.name.toLowerCase().replace(/\s+/g, '-');
    return `${API_BASE_URL}/static/${product.category}/${imageName}.png`;
  };

  return (
    <div className="min-h-screen bg-bharat-background p-4">
      <div className="max-w-6xl mx-auto">
        <StepIndicator currentStep="negotiation" role="vendor" />
        
        <div className="grid gap-6">
          {/* Session Info Card */}
          <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-bharat-primary">{t('vendorDashboard')}</h2>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-bharat-muted" />
                <span className="text-bharat-muted">
                  {session?.status === 'active' ? t('customerConnected') : t('waitingForCustomer')}
                </span>
              </div>
            </div>
          </div>

          {/* Session Code Card - Compact & Elegant */}
          <div className="bg-white rounded-lg shadow-md border border-bharat-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-bharat-background rounded-lg px-3 py-2 border border-bharat-border">
                  <span className="text-sm text-bharat-muted font-medium">{t('sessionCode')}</span>
                </div>
                <div className="bg-bharat-primary bg-opacity-10 rounded-lg px-4 py-2 border border-bharat-primary border-opacity-30">
                  <span className="text-lg font-bold text-bharat-primary tracking-wider">
                    {session?.id || 'Loading...'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (session?.id) {
                      navigator.clipboard.writeText(session.id);
                      setShowCopySuccessPopup(true);
                    }
                  }}
                  className="bg-bharat-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{t('copy')}</span>
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-bharat-muted">{t('shareWithCustomer')}</p>
              </div>
            </div>
          </div>

          {/* Pending Approvals Notification */}
          {pendingApprovals.length > 0 && !showApprovalPopup && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-800 font-medium">
                    {pendingApprovals.length} {t('priceProposalsAwaiting')}
                  </span>
                </div>
                <button
                  onClick={() => setShowApprovalPopup(pendingApprovals[0])}
                  className="bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-700 transition-colors"
                >
                  {t('review')}
                </button>
              </div>
            </div>
          )}

          {/* Pending Cash Payments Notification */}
          {pendingCashPayments.length > 0 && !showPaymentPopup && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-800 font-medium">
                    {pendingCashPayments.length} {t('cashPaymentsAwaiting')}
                  </span>
                </div>
                <button
                  onClick={() => setShowPaymentPopup(pendingCashPayments[0])}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  {t('review')}
                </button>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Products Overview with Stock Management */}
            <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-bharat-primary flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>{t('inventoryManagement')}</span>
                </h3>
                <button
                  onClick={() => onAddMoreProducts && onAddMoreProducts()}
                  className="bg-bharat-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('addProducts')}</span>
                </button>
              </div>
              <div className="space-y-3">
                {localProducts.map((product) => (
                  <div key={product.id} className="border border-bharat-border rounded-lg p-4">
                    {/* FIXED: Added proper image handling */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-bharat-background border border-bharat-border flex-shrink-0">
                        <img 
                          src={getImageUrl(product)} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, product.id, product.category)}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-bharat-primary">{translateProductName(product.name)}</h4>
                        <p className="text-sm text-bharat-muted">{t('marketPrice')}: ₹{product.marketPrice}{t('perKg')}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {/* Price Management */}
                      <div>
                        <label className="block text-xs font-medium text-bharat-muted mb-1">{t('yourPrice')} (₹{t('perKg')})</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            value={pendingPriceChanges[product.id] !== undefined ? pendingPriceChanges[product.id] : product.vendorPrice}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Browser-side validation: only allow numbers and decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                const numValue = value === '' ? 0 : parseFloat(value);
                                if (!isNaN(numValue) && numValue >= 0) {
                                  setPendingPriceChanges(prev => ({ ...prev, [product.id]: value }));
                                  setEditingPrice(prev => ({ ...prev, [product.id]: true }));
                                }
                              }
                            }}
                            onBlur={(e) => {
                              // Clean up the value on blur
                              const value = e.target.value;
                              const numValue = parseFloat(value) || 0;
                              setPendingPriceChanges(prev => ({ ...prev, [product.id]: numValue.toString() }));
                            }}
                            className={`w-20 text-center border-2 rounded-lg py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent transition-colors ${
                              pendingPriceChanges[product.id] !== undefined 
                                ? 'border-orange-400 bg-orange-50 text-bharat-primary' 
                                : 'border-bharat-border text-bharat-primary'
                            }`}
                            placeholder="0"
                          />
                          
                          <button
                            onClick={() => handlePriceSave(product.id)}
                            className={`p-2 rounded-lg transition-colors shadow-sm ${
                              editingPrice[product.id] && pendingPriceChanges[product.id] !== undefined
                                ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            title="Save price"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Stock Management */}
                      <div>
                        <label className="block text-xs font-medium text-bharat-muted mb-1">{t('stock')} (kg)</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            value={pendingStockChanges[product.id] !== undefined ? pendingStockChanges[product.id] : product.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Browser-side validation: only allow numbers and decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                const numValue = value === '' ? 0 : parseFloat(value);
                                if (!isNaN(numValue) && numValue >= 0) {
                                  setPendingStockChanges(prev => ({ ...prev, [product.id]: value }));
                                  setEditingStock(prev => ({ ...prev, [product.id]: true }));
                                }
                              }
                            }}
                            onBlur={(e) => {
                              // Clean up the value on blur
                              const value = e.target.value;
                              const numValue = parseFloat(value) || 0;
                              setPendingStockChanges(prev => ({ ...prev, [product.id]: numValue.toString() }));
                            }}
                            className={`w-20 text-center border-2 rounded-lg py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent transition-colors ${
                              pendingStockChanges[product.id] !== undefined 
                                ? 'border-orange-400 bg-orange-50 text-bharat-primary' 
                                : 'border-bharat-border text-bharat-primary'
                            }`}
                            placeholder="0"
                          />
                          
                          <button
                            onClick={() => handleStockSave(product.id)}
                            className={`p-2 rounded-lg transition-colors shadow-sm ${
                              editingStock[product.id] && pendingStockChanges[product.id] !== undefined
                                ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            title="Save stock quantity"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div>
                        <label className="block text-xs font-medium text-bharat-muted mb-1">{t('status')}</label>
                        <div className={`px-3 py-2 rounded-lg text-xs font-medium border-2 h-10 flex items-center justify-center ${
                          product.quantity > 0 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {product.quantity > 0 ? `${product.quantity}kg ${t('available')}` : t('outOfStock')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {localProducts.length === 0 && (
                  <div className="text-center py-8 text-bharat-muted">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('noProductsAvailable')}</p>
                    <button
                      onClick={() => onAddMoreProducts && onAddMoreProducts()}
                      className="mt-2 text-bharat-primary hover:underline"
                    >
                      {t('addProducts')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Cart View */}
            <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6 self-start">
              <div className="flex items-center space-x-3 mb-4">
                <ShoppingCart className="w-6 h-6 text-bharat-primary" />
                <h3 className="text-xl font-semibold text-bharat-primary">{t('customersCart')}</h3>
              </div>
              {customerCart.length === 0 ? (
                <div className="text-center py-6 text-bharat-muted">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('cartIsEmpty')}</p>
                  <p className="text-sm mt-1">{t('itemsWillAppearHere')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerCart.map((item) => {
                    // Find the original product to get the base name for translation
                    const originalProduct = localProducts.find(p => p.id === item.productId);
                    const displayName = originalProduct ? translateProductName(originalProduct.name) : item.name;
                    
                    return (
                      <div key={item.productId} className="border p-3 rounded-lg bg-bharat-background flex justify-between">
                        <div>
                          <h4 className="font-medium">{displayName}</h4>
                          <p className="text-sm">₹{item.agreedPrice} × {item.quantity}kg</p>
                        </div>
                        <p className="font-bold">₹{item.agreedPrice * item.quantity}</p>
                      </div>
                    );
                  })}
                  <div className="border-t pt-4 flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span className="text-xl text-bharat-success">₹{calculateCartTotal()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Negotiations Section */}
          {negotiations.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-bharat-negotiation" />
                <h3 className="text-xl font-semibold text-bharat-primary">{t('priceNegotiations')}</h3>
              </div>
              <div className="grid gap-4">
                {negotiations.map((n) => {
                  const product = products.find(p => p.id === n.productId);
                  return (
                    <div key={n.id} className="border rounded-lg p-4">
                      <h4 className="font-bold text-bharat-primary">{translateProductName(product?.name)}</h4>
                      <p className="text-sm text-bharat-muted">{t('offered')}: ₹{n.proposedPrice} ({t('round')} {n.round})</p>
                      
                      {n.status === 'final_offer' || n.status === 'accepted' ? (
                        <div className="bg-green-50 p-3 rounded mt-2">
                          <p className="text-green-700 font-medium">{t('status')}: {n.status.toUpperCase()} - ₹{n.finalPrice || n.proposedPrice}</p>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <input 
                            type="number" 
                            className="border p-2 rounded w-28" 
                            placeholder={t('counter')}
                            value={counterPrices[n.id] || ''}
                            onChange={(e) => setCounterPrices({...counterPrices, [n.id]: e.target.value})}
                          />
                          <button onClick={() => handleNegotiationResponse(n.id, 'counter', counterPrices[n.id])} className="bg-blue-600 text-white px-4 py-2 rounded">{t('counter')}</button>
                          <button onClick={() => handleNegotiationResponse(n.id, 'accept', n.proposedPrice)} className="bg-green-600 text-white px-4 py-2 rounded">{t('accept')}</button>
                          <button onClick={() => handleNegotiationResponse(n.id, 'reject')} className="bg-red-600 text-white px-4 py-2 rounded">{t('reject')}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <CustomMessagePanel />
      
      {/* Vendor Approval Popup */}
      {showApprovalPopup && (
        <VendorApprovalPopup
          negotiation={showApprovalPopup.negotiation}
          product={showApprovalPopup.product}
          onAccept={handleApprovalAccept}
          onReject={handleApprovalReject}
          onCustomMessage={handleApprovalCustomMessage}
          onClose={handleApprovalPopupClose}
        />
      )}

      {/* Cash Payment Confirmation Popup */}
      {showPaymentPopup && (
        <NotificationPopup
          isOpen={true}
          onClose={handlePaymentPopupClose}
          type="info"
          title={t('cashPaymentConfirmation')}
          message={`${t('customerWantsToPay')} ₹${showPaymentPopup.totalAmount} ${t('inCashFor')}: ${showPaymentPopup.cart.map(item => {
            const originalProduct = localProducts.find(p => p.id === item.productId);
            const displayName = originalProduct ? translateProductName(originalProduct.name) : item.name;
            return `${displayName} (${item.quantity}kg)`;
          }).join(', ')}. ${t('pleaseConfirmPayment')}.`}
          showBackButton={false}
          showMessageButton={false}
          customActions={
            <div className="flex space-x-2">
              <button
                onClick={() => handleCashPaymentConfirm(showPaymentPopup)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{t('confirmPayment')}</span>
              </button>
              <button
                onClick={() => handleCashPaymentReject(showPaymentPopup)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
              >
                <XCircle className="w-4 h-4" />
                <span>{t('reject')}</span>
              </button>
            </div>
          }
        />
      )}

      {/* Copy Success Popup */}
      {showCopySuccessPopup && (
        <NotificationPopup
          isOpen={true}
          onClose={() => setShowCopySuccessPopup(false)}
          type="success"
          title={t('sessionCodeCopied')}
          message={t('sessionCodeCopiedMessage')}
          showBackButton={false}
          showMessageButton={false}
          customActions={
            <button
              onClick={() => setShowCopySuccessPopup(false)}
              className="w-full bg-bharat-primary text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {t('gotIt')}
            </button>
          }
        />
      )}

      {/* Sale Completed Popup */}
      {showSaleCompletedPopup && (
        <NotificationPopup
          isOpen={true}
          onClose={() => setShowSaleCompletedPopup(null)}
          type="success"
          title={t('saleCompletedSuccessfully')}
          message={`${t('items')}: ${showSaleCompletedPopup.items}. ${t('total')}: ₹${showSaleCompletedPopup.total}. ${t('paymentMethod')}: ${showSaleCompletedPopup.paymentMethod}. ${t('stockUpdatedAutomatically')}.`}
          showBackButton={false}
          showMessageButton={false}
          customActions={
            <button
              onClick={() => setShowSaleCompletedPopup(null)}
              className="w-full bg-bharat-success text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('continue')}
            </button>
          }
        />
      )}
    </div>
  );
};

export default VendorDashboard;
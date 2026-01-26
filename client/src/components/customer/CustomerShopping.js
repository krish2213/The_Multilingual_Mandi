import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, CreditCard, Edit2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import StepIndicator from '../common/StepIndicator';
import SpeakButton from '../common/SpeakButton';
import CustomMessagePanel from '../common/CustomMessagePanel';

const CustomerShopping = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [negotiations, setNegotiations] = useState({});
  const [negotiationRounds, setNegotiationRounds] = useState({});
  const { socket, session, language, proposePrice } = useSocket();
  const { t } = useTranslation();

  useEffect(() => {
    if (socket) {
      socket.on('inventory-updated', (data) => {
        console.log('✓ Inventory received:', data.products.length, 'products');
        setProducts(data.products);
      });

      socket.on('negotiation-update', (data) => {
        const { negotiation, result } = data;
        console.log('✓ Negotiation update:', result.action);
        
        setNegotiations(prev => ({
          ...prev,
          [negotiation.productId]: {
            ...negotiation,
            ...result
          }
        }));
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

      return () => {
        socket.off('inventory-updated');
        socket.off('negotiation-update');
        socket.off('negotiation-response');
      };
    }
  }, [socket]);

  // Request products when session becomes active
  useEffect(() => {
    if (socket && session?.status === 'active' && session?.id) {
      console.log('✓ Requesting products for session:', session.id);
      socket.emit('get-products', { sessionId: session.id });
    }
  }, [socket, session]);

  // Sync cart with vendor in real-time
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

    const cartItem = {
      productId: product.id,
      name: product.name,
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

    // Notify vendor
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

    // Notify vendor
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

    setCart(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));

    // Notify vendor
    if (socket && session?.id) {
      socket.emit('cart-quantity-changed', {
        sessionId: session.id,
        productId,
        newQuantity
      });
    }
  };

  const handlePriceNegotiation = (productId, proposedPrice) => {
    const currentRound = negotiationRounds[productId] || 0;
    const newRound = currentRound + 1;
    
    setNegotiationRounds(prev => ({
      ...prev,
      [productId]: newRound
    }));

    const product = products.find(p => p.id === productId);
    proposePrice(productId, proposedPrice, newRound, product?.marketPrice || proposedPrice);
    
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

  const generateUPIString = () => {
    const total = calculateTotal();
    return `upi://pay?pa=vendor@vpa&am=${total}&cu=INR&tn=Multilingual Mandi Payment`;
  };

  const handlePayment = () => {
    const upiString = generateUPIString();
    
    alert(`Payment initiated for ₹${calculateTotal()}\n\nUPI String: ${upiString}`);
    
    setTimeout(() => {
      alert('Payment successful! Thank you for your purchase.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-bharat-background p-4">
      <div className="max-w-6xl mx-auto">
        <StepIndicator currentStep="negotiation" role="customer" />
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <h2 className="text-2xl font-bold text-bharat-primary">
                  Available Products
                </h2>
                <SpeakButton 
                  text="Available Products" 
                  language={language} 
                  size="md"
                />
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 text-bharat-muted">
                  <p className="text-lg mb-2">No products available yet</p>
                  <p className="text-sm">Waiting for vendor to add products...</p>
                </div>
              ) : (
                <div className="grid gap-4">
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
          </div>

          {/* Cart & Checkout */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ShoppingCart className="w-6 h-6 text-bharat-primary" />
                <h3 className="text-xl font-semibold text-bharat-primary">
                  Shopping Cart
                </h3>
                <SpeakButton 
                  text="Shopping Cart" 
                  language={language} 
                  size="sm"
                />
              </div>

              {cart.length === 0 ? (
                <p className="text-bharat-muted text-center py-8">
                  Your cart is empty
                </p>
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

            {/* Checkout */}
            {cart.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
                <h3 className="text-xl font-semibold text-bharat-primary mb-4">
                  Order Summary
                </h3>
                
                <div className="space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}kg</span>
                      <span>₹{item.agreedPrice * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-bharat-border pt-4 mb-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-bharat-primary">₹{calculateTotal()}</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-bharat-success text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Pay with UPI</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <CustomMessagePanel />
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart, language, t }) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="border border-bharat-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        <img
          src={product.image}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/64x64/e2e8f0/64748b?text=${product.name.charAt(0)}`;
          }}
        />
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-bharat-primary">
              {product.name}
            </h4>
            <SpeakButton 
              text={product.name} 
              language={language} 
              size="sm"
            />
          </div>
          <p className="text-bharat-muted text-sm mb-2">
            ₹{product.vendorPrice}/kg • {product.quantity}kg available
          </p>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-6 h-6 rounded-full bg-bharat-border text-bharat-primary hover:bg-bharat-primary hover:text-white transition-colors flex items-center justify-center"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                className="w-6 h-6 rounded-full bg-bharat-primary text-white hover:bg-opacity-90 transition-colors flex items-center justify-center"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <button
              onClick={() => onAddToCart(product, quantity)}
              className="px-4 py-2 bg-bharat-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm"
            >
              {t('addToCart')}
            </button>
          </div>
        </div>
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
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity);

  const canNegotiate = negotiationRound < 2 && 
    (!negotiation || negotiation.status === 'rejected');

  const showFinalOffer = negotiation?.status === 'final_offer';

  const handleQuantitySave = () => {
    if (editQuantity > 0) {
      onUpdateQuantity(item.productId, editQuantity);
    }
    setIsEditingQuantity(false);
  };

  const handleQuantityCancel = () => {
    setEditQuantity(item.quantity);
    setIsEditingQuantity(false);
  };

  return (
    <div className="border border-bharat-border rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <img
          src={item.image}
          alt={item.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
        
        <div className="flex-1">
          <h4 className="font-medium text-bharat-primary mb-2">
            {item.name}
          </h4>
          
          {/* Editable Quantity */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-bharat-muted">Quantity:</span>
            {!isEditingQuantity ? (
              <>
                <span className="font-medium">{item.quantity} kg</span>
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
                <button
                  onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                  className="w-6 h-6 rounded-full bg-bharat-border text-bharat-primary hover:bg-bharat-primary hover:text-white transition-colors flex items-center justify-center"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                  className="w-12 text-center border border-bharat-border rounded py-1 text-sm"
                  min="1"
                />
                <button
                  onClick={() => setEditQuantity(editQuantity + 1)}
                  className="w-6 h-6 rounded-full bg-bharat-primary text-white hover:bg-opacity-90 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={handleQuantitySave}
                  className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  title="Save"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleQuantityCancel}
                  className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Original Price:</span>
              <span>₹{item.originalPrice}/kg</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Current Price:</span>
              <span>₹{item.agreedPrice}/kg</span>
            </div>
            <div className="flex justify-between font-semibold text-bharat-primary">
              <span>Subtotal:</span>
              <span>₹{item.agreedPrice * item.quantity}</span>
            </div>
          </div>

          {/* Negotiation */}
          {canNegotiate && (
            <div className="mt-3 p-3 bg-bharat-background rounded-lg">
              <p className="text-sm text-bharat-muted mb-2">
                {t('proposePrice')}:
              </p>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(parseInt(e.target.value) || 0)}
                  className="flex-1 p-2 border border-bharat-border rounded text-sm"
                  min="1"
                />
                <button
                  onClick={() => onNegotiate(item.productId, proposedPrice)}
                  className="px-3 py-2 bg-bharat-negotiation text-white rounded text-sm hover:bg-opacity-90"
                >
                  Propose
                </button>
              </div>
            </div>
          )}

          {/* Final Offer */}
          {showFinalOffer && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-2">
                {t('finalOffer')}: ₹{negotiation.finalPrice}/kg
              </p>
              <p className="text-xs text-red-600 mb-2">
                {t('takeItOrLeave')}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => onUpdateQuantity(item.productId, item.quantity)}
                  className="px-3 py-1 bg-bharat-success text-white rounded text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => onRemove(item.productId)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Negotiation Status */}
          {negotiation && (
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded ${
                negotiation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                negotiation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                negotiation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {negotiation.status === 'pending' ? 'Negotiating...' :
                 negotiation.status === 'accepted' ? 'Price Accepted' :
                 negotiation.status === 'rejected' ? 'Price Rejected' :
                 'Final Offer'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(item.productId)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CustomerShopping;
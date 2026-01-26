import { useState, useEffect } from 'react';
import { Copy, Users, Clock, CheckCircle, XCircle, ShoppingCart, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import StepIndicator from '../common/StepIndicator';
import SpeakButton from '../common/SpeakButton';
import CustomMessagePanel from '../common/CustomMessagePanel';

const VendorDashboard = ({ products }) => {
  const [negotiations, setNegotiations] = useState([]);
  const [customerCart, setCustomerCart] = useState([]);
  const [counterPrices, setCounterPrices] = useState({}); // FIXED: Added missing state
  const { socket, session, language, respondToNegotiation } = useSocket();
  const { t } = useTranslation();

  useEffect(() => {
    if (socket) {
      socket.on('price-proposed', (data) => {
        setNegotiations(prev => [...prev, data.negotiation]);
      });

      socket.on('customer-cart-updated', (data) => {
        setCustomerCart(data.cart);
      });

      return () => {
        socket.off('price-proposed');
        socket.off('customer-cart-updated');
      };
    }
  }, [socket]);

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

  return (
    <div className="min-h-screen bg-bharat-background p-4">
      <div className="max-w-6xl mx-auto">
        <StepIndicator currentStep="negotiation" role="vendor" />
        
        <div className="grid gap-6">
          {/* Session Info Card */}
          <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-bharat-primary">Vendor Dashboard</h2>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-bharat-muted" />
                <span className="text-bharat-muted">
                  {session?.status === 'active' ? 'Customer Connected' : 'Waiting for Customer'}
                </span>
              </div>
            </div>
            {/* Session ID Section omitted for brevity but should stay same as your original */}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Products Overview */}
            <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
              <h3 className="text-xl font-semibold mb-4 text-bharat-primary">Available Products</h3>
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="border border-bharat-border rounded-lg p-3 flex items-center space-x-3">
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-medium text-bharat-primary">{product.name}</h4>
                      <div className="flex items-center gap-2 text-sm">
  <input
    type="number"
    value={product.vendorPrice}
    onChange={(e) =>
      socket.emit('vendor-price-edit', {
        sessionId: session.id,
        productId: product.id,
        newPrice: Number(e.target.value)
      })
    }
    className="border rounded px-2 py-1 w-24"
  />
  <span className="text-bharat-muted">/kg • {product.quantity}kg</span>
</div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Cart View */}
            <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ShoppingCart className="w-6 h-6 text-bharat-primary" />
                <h3 className="text-xl font-semibold text-bharat-primary">Customer's Cart</h3>
              </div>
              {customerCart.length === 0 ? (
                <p className="text-center py-8 text-bharat-muted">Cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {customerCart.map((item) => (
                    <div key={item.productId} className="border p-3 rounded-lg bg-bharat-background flex justify-between">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm">₹{item.agreedPrice} × {item.quantity}kg</p>
                      </div>
                      <p className="font-bold">₹{item.agreedPrice * item.quantity}</p>
                    </div>
                  ))}
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
                <h3 className="text-xl font-semibold text-bharat-primary">Price Negotiations</h3>
              </div>
              <div className="grid gap-4">
                {negotiations.map((n) => {
                  const product = products.find(p => p.id === n.productId);
                  return (
                    <div key={n.id} className="border rounded-lg p-4">
                      <h4 className="font-bold text-bharat-primary">{product?.name}</h4>
                      <p className="text-sm text-bharat-muted">Offered: ₹{n.proposedPrice} (Round {n.round})</p>
                      
                      {n.status === 'final_offer' || n.status === 'accepted' ? (
                        <div className="bg-green-50 p-3 rounded mt-2">
                          <p className="text-green-700 font-medium">Status: {n.status.toUpperCase()} - ₹{n.finalPrice || n.proposedPrice}</p>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <input 
                            type="number" 
                            className="border p-2 rounded w-28" 
                            placeholder="Counter"
                            value={counterPrices[n.id] || ''}
                            onChange={(e) => setCounterPrices({...counterPrices, [n.id]: e.target.value})}
                          />
                          <button onClick={() => handleNegotiationResponse(n.id, 'counter', counterPrices[n.id])} className="bg-blue-600 text-white px-4 py-2 rounded">Counter</button>
                          <button onClick={() => handleNegotiationResponse(n.id, 'accept', n.proposedPrice)} className="bg-green-600 text-white px-4 py-2 rounded">Accept</button>
                          <button onClick={() => handleNegotiationResponse(n.id, 'reject')} className="bg-red-600 text-white px-4 py-2 rounded">Reject</button>
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
    </div>
  );
};

export default VendorDashboard;
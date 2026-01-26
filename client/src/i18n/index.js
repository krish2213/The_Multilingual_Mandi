import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      'welcome': 'Welcome to Multilingual Mandi',
      'language': 'Language',
      'continue': 'Continue',
      'back': 'Back',
      'next': 'Next',
      'cancel': 'Cancel',
      'confirm': 'Confirm',
      'price': 'Price',
      'quantity': 'Quantity',
      'total': 'Total',
      'accept': 'Accept',
      'reject': 'Reject',
      
      // Roles
      'vendor': 'Vendor',
      'customer': 'Customer',
      'selectRole': 'Select Your Role',
      'startSelling': 'Start Selling Session',
      'joinSession': 'Join Session',
      
      // Categories
      'vegetables': 'Vegetables',
      'fruits': 'Fruits',
      'fish': 'Fish',
      'flowers': 'Flowers',
      'selectCategories': 'Select Product Categories',
      
      // Session
      'sessionId': 'Session ID',
      'enterSessionId': 'Enter Session ID',
      'sessionCreated': 'Session Created Successfully',
      'shareSessionId': 'Share this Session ID with customers',
      'waitingForCustomer': 'Waiting for customer to join...',
      
      // Inventory
      'inventory': 'Inventory Management',
      'marketPrice': 'Market Price',
      'yourPrice': 'Your Price',
      'floorPrice': 'Minimum Price',
      'availableQuantity': 'Available Quantity',
      'updateInventory': 'Update Inventory',
      
      // Negotiation
      'negotiation': 'Price Negotiation',
      'proposePrice': 'Propose Better Price',
      'counterOffer': 'Counter Offer',
      'finalOffer': 'Final Offer',
      'takeItOrLeave': 'Take it or Leave it',
      'addToCart': 'Add to Cart',
      'proceedToPayment': 'Proceed to Payment',
      
      // Messages
      'customMessage': 'Send Custom Message',
      'typeMessage': 'Type your message...',
      'sendMessage': 'Send Message',
      
      // Steps
      'setup': 'Setup',
      'inventory': 'Inventory',
      'negotiation': 'Negotiation',
      'payment': 'Payment'
    }
  },
  hi: {
    translation: {
      // Common
      'welcome': 'बहुभाषी मंडी में आपका स्वागत है',
      'language': 'भाषा',
      'continue': 'जारी रखें',
      'back': 'वापस',
      'next': 'आगे',
      'cancel': 'रद्द करें',
      'confirm': 'पुष्टि करें',
      'price': 'कीमत',
      'quantity': 'मात्रा',
      'total': 'कुल',
      'accept': 'स्वीकार करें',
      'reject': 'अस्वीकार करें',
      
      // Roles
      'vendor': 'विक्रेता',
      'customer': 'ग्राहक',
      'selectRole': 'अपनी भूमिका चुनें',
      'startSelling': 'बिक्री सत्र शुरू करें',
      'joinSession': 'सत्र में शामिल हों',
      
      // Categories
      'vegetables': 'सब्जियां',
      'fruits': 'फल',
      'fish': 'मछली',
      'flowers': 'फूल',
      'selectCategories': 'उत्पाद श्रेणियां चुनें',
      
      // Session
      'sessionId': 'सत्र आईडी',
      'enterSessionId': 'सत्र आईडी दर्ज करें',
      'sessionCreated': 'सत्र सफलतापूर्वक बनाया गया',
      'shareSessionId': 'इस सत्र आईडी को ग्राहकों के साथ साझा करें',
      'waitingForCustomer': 'ग्राहक के शामिल होने की प्रतीक्षा...',
      
      // Inventory
      'inventory': 'इन्वेंटरी प्रबंधन',
      'marketPrice': 'बाजार मूल्य',
      'yourPrice': 'आपकी कीमत',
      'floorPrice': 'न्यूनतम कीमत',
      'availableQuantity': 'उपलब्ध मात्रा',
      'updateInventory': 'इन्वेंटरी अपडेट करें',
      
      // Negotiation
      'negotiation': 'मूल्य बातचीत',
      'proposePrice': 'बेहतर कीमत प्रस्तावित करें',
      'counterOffer': 'प्रति प्रस्ताव',
      'finalOffer': 'अंतिम प्रस्ताव',
      'takeItOrLeave': 'लो या छोड़ो',
      'addToCart': 'कार्ट में जोड़ें',
      'proceedToPayment': 'भुगतान के लिए आगे बढ़ें',
      
      // Messages
      'customMessage': 'कस्टम संदेश भेजें',
      'typeMessage': 'अपना संदेश टाइप करें...',
      'sendMessage': 'संदेश भेजें',
      
      // Steps
      'setup': 'सेटअप',
      'inventory': 'इन्वेंटरी',
      'negotiation': 'बातचीत',
      'payment': 'भुगतान'
    }
  },
  ta: {
    translation: {
      // Common
      'welcome': 'பல்மொழி மண்டிக்கு வரவேற்கிறோம்',
      'language': 'மொழி',
      'continue': 'தொடரவும்',
      'back': 'பின்னால்',
      'next': 'அடுத்து',
      'cancel': 'ரத்து செய்',
      'confirm': 'உறுதிப்படுத்து',
      'price': 'விலை',
      'quantity': 'அளவு',
      'total': 'மொத்தம்',
      'accept': 'ஏற்றுக்கொள்',
      'reject': 'நிராகரி',
      
      // Roles
      'vendor': 'விற்பனையாளர்',
      'customer': 'வாடிக்கையாளர்',
      'selectRole': 'உங்கள் பாத்திரத்தை தேர்ந்தெடுக்கவும்',
      'startSelling': 'விற்பனை அமர்வைத் தொடங்கவும்',
      'joinSession': 'அமர்வில் சேரவும்',
      
      // Categories
      'vegetables': 'காய்கறிகள்',
      'fruits': 'பழங்கள்',
      'fish': 'மீன்',
      'flowers': 'பூக்கள்',
      'selectCategories': 'தயாரிப்பு வகைகளைத் தேர்ந்தெடுக்கவும்',
      
      // Session
      'sessionId': 'அமர்வு ஐடி',
      'enterSessionId': 'அமர்வு ஐடியை உள்ளிடவும்',
      'sessionCreated': 'அமர்வு வெற்றிகரமாக உருவாக்கப்பட்டது',
      'shareSessionId': 'இந்த அமர்வு ஐடியை வாடிக்கையாளர்களுடன் பகிரவும்',
      'waitingForCustomer': 'வாடிக்கையாளர் சேர காத்திருக்கிறது...',
      
      // Inventory
      'inventory': 'சரக்கு மேலாண்மை',
      'marketPrice': 'சந்தை விலை',
      'yourPrice': 'உங்கள் விலை',
      'floorPrice': 'குறைந்தபட்ச விலை',
      'availableQuantity': 'கிடைக்கும் அளவு',
      'updateInventory': 'சரக்கு புதுப்பிக்கவும்',
      
      // Negotiation
      'negotiation': 'விலை பேச்சுவார்த்தை',
      'proposePrice': 'சிறந்த விலையை முன்மொழியுங்கள்',
      'counterOffer': 'எதிர் வாய்ப்பு',
      'finalOffer': 'இறுதி வாய்ப்பு',
      'takeItOrLeave': 'எடுத்துக் கொள்ளுங்கள் அல்லது விட்டுவிடுங்கள்',
      'addToCart': 'கார்ட்டில் சேர்க்கவும்',
      'proceedToPayment': 'பணம் செலுத்துவதற்கு தொடரவும்',
      
      // Messages
      'customMessage': 'தனிப்பயன் செய்தி அனுப்பவும்',
      'typeMessage': 'உங்கள் செய்தியை தட்டச்சு செய்யுங்கள்...',
      'sendMessage': 'செய்தி அனுப்பு',
      
      // Steps
      'setup': 'அமைப்பு',
      'inventory': 'சரக்கு',
      'negotiation': 'பேச்சுவார்த்தை',
      'payment': 'பணம்'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
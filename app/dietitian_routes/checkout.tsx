import React, { createContext, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { Check, CreditCard as Edit2 } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
// Types
type OrderItem = {
  item: {
    id: number;
    name: string;
    category: string;
    picture: string;
    description: string;
    staffPrice: number;
    patientPrice: number;
    dietitianPrice: number;
    combination: string;
    available: boolean;
  };
  quantity: number;
};

type Address = {
  fullAddress: string;
};

type OrderContextType = {
  orderSummary: {
    items: OrderItem[];
    total: number;
    timestamp: string;
  };
  address: Address;
  isEditingAddress: boolean;
  deliveryTip: number;
  toPay: number; // <-- Add this
  setAddress: (address: Address) => void;
  setIsEditingAddress: (isEditing: boolean) => void;
  setDeliveryTip: (tip: number) => void;
};

// Context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider
function OrderProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address>({ fullAddress: '' });
  const [isEditingAddress, setIsEditingAddress] = useState(true);
  const [deliveryTip, setDeliveryTip] = useState(0);

  const route = useRoute();
  const { order_detailes } = route.params as { order_detailes: any };
  const [orderSummary] = useState(order_detailes);

  // 🔧 Compute toPay here
  const itemTotal = orderSummary.items.reduce((total: number, item: OrderItem) =>
    total + (item.item.dietitianPrice * item.quantity), 0);
  const deliveryFee = 48;
  const platformFee = 10;
  const taxAndCharges = itemTotal * 0.15;
  const toPay = itemTotal + deliveryFee + Number(deliveryTip) + platformFee + taxAndCharges;

  return (
    <OrderContext.Provider value={{
      orderSummary,
      address,
      isEditingAddress,
      deliveryTip,
      setAddress,
      setIsEditingAddress,
      setDeliveryTip,
      toPay, // ✅ Now this is defined
    }}>
      {children}
    </OrderContext.Provider>
  );
}

// Hook
function useOrder() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder must be used within an OrderProvider');
  return context;
}

// Helper
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Components
function OrderSummary() {
  const { orderSummary } = useOrder();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>Order Date: {formatDate(orderSummary.timestamp)}</Text>
      </View>
      {orderSummary.items.map((orderItem) => (
        <View key={orderItem.item.id} style={styles.itemContainer}>
          <Image source={{ uri: orderItem.item.picture }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{orderItem.item.name}</Text>
            <Text style={styles.itemCategory}>{orderItem.item.category}</Text>
            <Text style={styles.itemDescription}>{orderItem.item.description}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.itemPrice}>${orderItem.item.dietitianPrice}</Text>
            <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function DeliveryDetails() {
  const { address, setAddress, isEditingAddress, setIsEditingAddress } = useOrder();
  return (
    <View style={styles.section}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        {!isEditingAddress && (
          <TouchableOpacity onPress={() => setIsEditingAddress(true)} style={styles.editButton}>
            <Edit2 size={18} color="#0A5F38" />
          </TouchableOpacity>
        )}
      </View>
      {isEditingAddress ? (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.textArea}
            value={address.fullAddress}
            onChangeText={(value) => setAddress({ fullAddress: value })}
            placeholder="Enter your complete delivery address"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.saveButton} onPress={() => setIsEditingAddress(false)}>
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.savedAddressContainer}>
          {address.fullAddress ? (
            <Text style={styles.addressText}>{address.fullAddress}</Text>
          ) : (
            <Text style={styles.noAddressText}>No address saved yet. Tap edit to add delivery details.</Text>
          )}
        </View>
      )}
    </View>
  );
}

function OrderTotal() {
  const { orderSummary, deliveryTip, setDeliveryTip } = useOrder();

  const itemTotal = orderSummary.items.reduce((total, item) =>
    total + (item.item.dietitianPrice * item.quantity), 0);
  const deliveryFee = 48;
  const platformFee = 10;
  const taxAndCharges = itemTotal * 0.15;
  const toPay = itemTotal + deliveryFee + Number(deliveryTip) + platformFee + taxAndCharges;

  const renderRow = (label: string, amount: number, isTotal = false) => (
    <View style={[styles.row, isTotal && styles.totalRow]}>
      <Text style={[styles.label, isTotal && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.amount, isTotal && styles.totalAmount]}>${amount.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Total</Text>
      {renderRow('Item Total', itemTotal)}
      {renderRow('Delivery Fee (4.0 kms)', deliveryFee)}
      <View style={styles.row}>
        <Text style={styles.label}>Delivery Tip</Text>
        <TextInput
          style={styles.tipInput}
          value={deliveryTip.toString()}
          onChangeText={(value) => setDeliveryTip(Number(value) || 0)}
          keyboardType="numeric"
          placeholder="Enter tip"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      {renderRow('Platform Fee', platformFee)}
      {renderRow('GST and Restaurant Charges (15%)', taxAndCharges)}
      <View style={styles.divider} />
      {renderRow('TO PAY', toPay, true)}
    </View>
  );
}

function CheckoutButton() {
  const { address,toPay } = useOrder();
  const [isLoading, setIsLoading] = useState(false);
  const route = useRoute();
  const { order_detailes } = route.params as { order_detailes: any };
  const navigation = useNavigation<any>();
  const scaleAnim = new Animated.Value(1);

  const handlePress = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, easing: Easing.ease, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, easing: Easing.ease, useNativeDriver: true }),
    ]).start(async () => {
      if (!address.fullAddress) return;
        console.log(toPay)
      try {
        setIsLoading(true);
        const id = await AsyncStorage.getItem('patientUHID');
        if (!id) return;

        const order = {
          orderedRole: 'Patient',
          orderedUserId: id,
          itemName: order_detailes.items.map((i: OrderItem) => i.item.name).join(', '),
          quantity: order_detailes.items.reduce((sum:any, i:any) => sum + i.quantity, 0),
          category: order_detailes.items[0]?.item.category || 'General',
          price: toPay,
          orderStatus: null,
          paymentType: 'COD',
          paymentStatus: null,
          orderDateTime: order_detailes.timestamp,
          address: address.fullAddress,
        };

        const response = await axiosInstance.post('/orders', order);

        if (response.status === 200 || response.status === 201) {
          console.log()
          navigation.navigate('order-success', { status: true });
        }
      } catch (err) {
        console.log('Error submitting order:', err);
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.confirmButton, !address.fullAddress && styles.disabledButton]}
        onPress={handlePress}
        disabled={!address.fullAddress || isLoading}
      >
        <Text style={styles.confirmButtonText}>Confirm Diet</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Main Component
export default function CheckoutScreen() {
  return (
    <OrderProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <OrderSummary />
          <DeliveryDetails />
          <OrderTotal />
          <CheckoutButton />
        </ScrollView>
      </SafeAreaView>
    </OrderProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F7' },
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0A5F38', marginBottom: 16 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  editButton: { padding: 8 },
  itemContainer: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  itemCategory: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  itemDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  priceContainer: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 16, fontWeight: '600', color: '#0A5F38', marginBottom: 4 },
  itemQuantity: { fontSize: 14, color: '#6B7280' },
  orderInfo: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12, marginBottom: 16 },
  orderDate: { fontSize: 14, color: '#6B7280' },
  formContainer: { marginTop: 8 },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    height: 120,
  },
  saveButton: {
    backgroundColor: '#0A5F38',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  savedAddressContainer: { paddingVertical: 8 },
  addressText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  noAddressText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalRow: { marginTop: 4 },
  label: { fontSize: 14, color: '#4B5563' },
  amount: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0A5F38' },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#0A5F38' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  tipInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    width: 100,
    textAlign: 'right',
  },
  confirmButton: {
    backgroundColor: '#0A5F38',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A5F38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  confirmButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

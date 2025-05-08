import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MapPin, Phone, Calendar, Package, IndianRupee } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';

export default function UpdateOrderScreen() {
  type Order = {
    orderId: number;
    orderedRole: string;
    orderedName: string | null;
    orderedUserId: string;
    itemName: string;
    quantity: number;
    category: string;
    price: number;
    orderStatus: string;
    paymentType: string;
    paymentRecived: boolean;
    paymentStatus: string | null;
    orderDateTime: string;
    deliveryStatus: string | null;
    address: string;
    phoneNo: string | null;
  };

  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [deliveryStatus, setDeliveryStatus] = useState('OUT_FOR_DELIVERY');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axiosInstance.get(`/orders/${orderId}`, { timeout: 8000 });
        const orderData: Order = response.data;
        setOrder(orderData);
        setPaymentStatus(orderData.paymentRecived ? "COMPLETED" : 'PENDING');
        setDeliveryStatus(orderData.deliveryStatus ?? 'OutForDelivery');
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const handleUpdateOrder = async () => {
    try {
      await axiosInstance.patch(`orders/${orderId}/payment-received`, null, {
        params: { paymentReceived: paymentStatus === "COMPLETED" },
      });

      await axiosInstance.patch(`orders/${orderId}/delivery-status`, null, {
        params: { deliveryStatus },
      });

      router.back();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  if (loading) {
    return <View style={styles.container}><Text style={{ padding: 20 }}>Loading...</Text></View>;
  }

  if (!order) {
    return <View style={styles.container}><Text style={{ padding: 20 }}>Order not found</Text></View>;
  }

  const items = order.itemName.split(', ');
  const dateObj = new Date(order.orderDateTime);
  const formattedDate = dateObj.toLocaleDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const totalPrice = order.price;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order #{order.orderId}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Package size={25} color="#03A791" />
              <Text style={styles.statusLabel}>Delivery</Text>
              <Text style={styles.statusValue}>{order.deliveryStatus}</Text>
            </View>
            <View style={styles.statusItem}>
              <IndianRupee size={25} color="#28B463" />
              <Text style={styles.statusLabel}>Payment</Text>
              <Text style={styles.statusValue}>
                {order.paymentRecived ? 'Received' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => (
            <Text key={index} style={styles.itemText}>• {item}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Price</Text>
          <Text style={styles.priceText}>₹{totalPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailItem}>
            <MapPin size={20} color="#666" />
            <Text style={styles.detailText}>{order.address || 'No address provided'}</Text>
          </View>
          {order.phoneNo && (
            <View style={styles.detailItem}>
              <Phone size={20} color="#666" />
              <Text style={styles.detailText}>{order.phoneNo}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Calendar size={20} color="#666" />
            <Text style={styles.detailText}>{formattedDate} at {formattedTime}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>

          <Text style={styles.label}>Payment Status</Text>
          <View style={styles.buttonGroup}>
            {['PENDING', 'COMPLETED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.button, paymentStatus === status && styles.activeButton]}
                onPress={() => setPaymentStatus(status)}
              >
                <Text style={[styles.buttonText, paymentStatus === status && styles.activeButtonText]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Delivery Status</Text>
          <View style={styles.buttonGroup}>
            {['OutForDelivery', 'Delivered', 'OrderReceived', 'Cancelled'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.button, deliveryStatus === status && styles.activeButton]}
                onPress={() => setDeliveryStatus(status)}
              >
                <Text style={[styles.buttonText, deliveryStatus === status && styles.activeButtonText]}>
                  {status.replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateOrder}>
          <Text style={styles.updateButtonText}>Update Order</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F3F4',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 44,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E86AB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007074',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginTop: 4,
  },
  itemText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 12,
    marginTop: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    flexGrow: 1,
    minWidth: '48%',
  },
  buttonText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  activeButton: {
    backgroundColor: '#28B463',
    borderColor: '#2E86AB',
  },
  activeButtonText: {
    color: '#fff',
  },
  updateButton: {
    backgroundColor: '#28B463',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

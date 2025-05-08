import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  FlatList,
  TextInput,
  Dimensions
} from 'react-native';
import { useRouter} from 'expo-router';
import { ShoppingCart, Search, Plus, Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';


const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

interface FoodItem {
  id: number;
  name: string;
  category: string;
  picture: string | null;
  description: string;
  staffPrice: number;
  patientPrice: number;
  dietitianPrice: number;
  combination: string | null;
  available: boolean;
}

export default function FoodScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>()
  // const route = useRoute();
  // const { diet} = route.params as {diet:object};
//   console.log("After Create Diet")
//   console.log(diet)

    // const [initialFoodData,setinitialFoodData] = useState()
//   const initialFoodData: FoodItem[] = [
//     {
//       id: 403,
//       name: "Riaz",
//       category: "South",
//       picture: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg",
//       description: "Traditional South Indian meal",
//       staffPrice: 11.0,
//       patientPrice: 12.0,
//       dietitianPrice: 12.0,
//       combination: null,
//       available: true
//     },
//     {
//       id: 17,
//       name: "Rice Feed",
//       category: "Clear liquid",
//       picture: "https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg",
//       description: "Rice feed with low sodium for CKD.",
//       staffPrice: 8.0,
//       patientPrice: 16.0,
//       dietitianPrice: 14.0,
//       combination: null,
//       available: true
//     },
//     {
//         id: 17,
//         name: "Rice Feed 2",
//         category: "Clear",
//         picture: "https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg",
//         description: "Rice feed with low sodium for CKD.",
//         staffPrice: 8.0,
//         patientPrice: 16.0,
//         dietitianPrice: 14.0,
//         combination: null,
//         available: true
//       },
//     // ... other food items
//   ];
  
  const [foodData, setFoodData] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{item: FoodItem, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchRooms = async () => {
    try {
        const response = await axiosInstance.get(`/menu-items`);
        const data = response.data;
        setFoodData(data)
    } catch (error) {
        console.error('Failed to fetch rooms:', error);
    }
    };

    fetchRooms();
}, []);


  useEffect(() => {
    const uniqueCategories = Array.from(new Set(foodData.map(item => item.category)));
    setCategories(uniqueCategories);
  }, [foodData]);
  
  const filteredFoodItems = foodData.filter(item => 
    item.available && // Only show available items
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const addToCart = (item: FoodItem) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === item.id);
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };
  
  const removeFromCart = (itemId: number) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === itemId);
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingItemIndex].quantity > 1) {
        updatedCart[existingItemIndex].quantity -= 1;
      } else {
        updatedCart.splice(existingItemIndex, 1);
      }
      setCart(updatedCart);
    }
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, cartItem) => {
      return total + (cartItem.item.dietitianPrice * cartItem.quantity);
    }, 0);
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const orderSummary = {
      items: cart,
      total: calculateTotal(),
      timestamp: new Date().toISOString(),
    };
    
    console.log('Order submitted:');
    // alert('Order successfully placed!');

    const navigateOrederSuccess = (order_detailes:object) => {
      navigation.navigate('checkout',{order_detailes});
    };
    navigateOrederSuccess(orderSummary);
  };
  
  const renderFoodItem = ({ item }: { item: FoodItem }) => {
    const isInCart = cart.some(cartItem => cartItem.item.id === item.id);
    const cartItem = cart.find(cartItem => cartItem.item.id === item.id);
    
    return (
      <View style={styles.foodCard}>
        {item.picture ? (
          <Image 
            source={{ uri: item.picture }} 
            style={styles.foodImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{item.name[0]}</Text>
          </View>
        )}
        
        <View style={styles.foodContent}>
          <Text style={styles.foodName}>{item.name}</Text>
          
          {item.description ? (
            <Text style={styles.foodDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          
          <View style={styles.priceRow}>
            <Text style={styles.foodPrice}>₹{item.dietitianPrice.toFixed(2)}</Text>
            
            {isInCart ? (
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                
                <Text style={styles.quantity}>{cartItem?.quantity || 0}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => addToCart(item)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => addToCart(item)}
              >
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => setShowCart(!showCart)}
        >
          <ShoppingCart size={24} color="#166534" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          <TouchableOpacity 
            style={[
              styles.categoryTab, 
              selectedCategory === 'All' && styles.selectedCategoryTab
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory === 'All' && styles.selectedCategoryTabText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map((category, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.categoryTab, 
                selectedCategory === category && styles.selectedCategoryTab
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category && styles.selectedCategoryTabText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredFoodItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFoodItem}
        numColumns={2}
        contentContainerStyle={styles.foodGrid}
        columnWrapperStyle={styles.foodRow}
      />
      
      {showCart && (
        <View style={styles.cartContainer}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Your Order</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCart(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <TouchableOpacity 
                style={styles.addItemsButton}
                onPress={() => setShowCart(false)}
              >
                <Text style={styles.addItemsButtonText}>Add Items</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.cartItemsContainer}>
                {cart.map((cartItem, index) => (
                  <View key={index} style={styles.cartItem}>
                    {cartItem.item.picture ? (
                      <Image 
                        source={{ uri: cartItem.item.picture }}
                        style={styles.cartItemImage}
                      />
                    ) : (
                      <View style={styles.cartItemPlaceholder}>
                        <Text style={styles.cartItemPlaceholderText}>
                          {cartItem.item.name[0]}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{cartItem.item.name}</Text>
                      <Text style={styles.cartItemPrice}>
                        ₹{(cartItem.item.dietitianPrice * cartItem.quantity).toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.cartItemQuantity}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => removeFromCart(cartItem.item.id)}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.quantity}>{cartItem.quantity}</Text>
                      
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => addToCart(cartItem.item)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
              
              <View style={styles.cartFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.checkoutButton}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutButtonText}>Place Order</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#0f172a',
  },
  cartButton: {
    marginLeft: 16,
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryTabs: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  selectedCategoryTab: {
    backgroundColor: '#166534',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  selectedCategoryTabText: {
    color: '#fff',
  },
  foodGrid: {
    padding: 16,
  },
  foodRow: {
    justifyContent: 'space-between',
  },
  foodCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: 140,
  },
  placeholderImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  foodContent: {
    padding: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  addButton: {
    backgroundColor: '#166534',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  cartContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#64748b',
    lineHeight: 24,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  addItemsButton: {
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addItemsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cartItemsContainer: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cartItemPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  checkoutButton: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
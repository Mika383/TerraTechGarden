// api/combo.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://terarium.shop/api';

export interface ComboItem {
  comboItemId: number;
  terrariumVariantId: number | null;
  accessoryId: number | null;
  productType: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Combo {
  comboId: number;
  comboCategoryId: number;
  categoryName: string;
  name: string;
  description: string;
  imageUrl: string;
  originalPrice: number;
  comboPrice: number;
  discountPercent: number;
  saveAmount: number;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  soldQuantity: number;
  isInStock: boolean;
  items: ComboItem[];
  createdAt: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

// Get featured combos
export const getFeaturedCombos = async (take: number = 10): Promise<Combo[]> => {
  try {
    const response = await fetch(`${BASE_URL}/Combos/featured?take=${take}`);
    const result: ApiResponse<Combo[]> = await response.json();
    
    if (result.status === 200) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch featured combos');
    }
  } catch (error) {
    console.error('Error fetching featured combos:', error);
    throw error;
  }
};

// Get combo by ID
export const getComboById = async (comboId: number): Promise<Combo> => {
  try {
    const response = await fetch(`${BASE_URL}/Combos/${comboId}`);
    const result: ApiResponse<Combo> = await response.json();
    
    if (result.status === 200) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch combo');
    }
  } catch (error) {
    console.error('Error fetching combo:', error);
    throw error;
  }
};

// Add combo to cart
export const addComboToCart = async (comboId: number, quantity: number = 1): Promise<void> => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để thêm vào giỏ hàng');
    }
    
    const response = await fetch(`${BASE_URL}/Cart/add-combo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        comboId: comboId,
        quantity: quantity
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status !== 201) {
      throw new Error(result.message || 'Failed to add combo to cart');
    }
    
    return result;
  } catch (error) {
    console.error('Error adding combo to cart:', error);
    throw error;
  }
};

// Add combo to cart for guest users (localStorage)
export const addComboToLocalCart = (combo: Combo, quantity: number = 1): void => {
  try {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    const newItem = {
      id: `combo-${combo.comboId}`,
      comboId: combo.comboId,
      name: combo.name,
      price: combo.comboPrice,
      image: combo.imageUrl,
      quantity: quantity,
      selected: false,
      type: 'combo'
    };

    const existingIndex = cartItems.findIndex((item: any) => item.id === newItem.id);

    if (existingIndex >= 0) {
      cartItems[existingIndex].quantity += quantity;
    } else {
      cartItems.push(newItem);
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Dispatch event để update cart counter
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error('Error adding combo to local cart:', error);
    throw error;
  }
};

// Combined add to cart function that handles both logged in and guest users
export const handleAddComboToCart = async (combo: Combo, quantity: number = 1): Promise<string> => {
  const isLoggedIn = !!localStorage.getItem('authToken');

  if (isLoggedIn) {
    try {
      await addComboToCart(combo.comboId, quantity);
      return `${combo.name} đã được thêm vào giỏ hàng!`;
    } catch (error) {
      throw error;
    }
  } else {
    try {
      addComboToLocalCart(combo, quantity);
      return `${combo.name} đã được thêm vào giỏ hàng!`;
    } catch (error) {
      throw error;
    }
  }
};

// Get all combos with pagination
export const getAllCombos = async (page: number = 1, limit: number = 10): Promise<{ combos: Combo[], total: number }> => {
  try {
    const response = await fetch(`${BASE_URL}/Combos?page=${page}&limit=${limit}`);
    const result = await response.json();
    
    if (result.status === 200) {
      return {
        combos: result.data.items || result.data,
        total: result.data.total || result.data.length
      };
    } else {
      throw new Error(result.message || 'Failed to fetch combos');
    }
  } catch (error) {
    console.error('Error fetching combos:', error);
    throw error;
  }
};

// Get combos by category
export const getCombosByCategory = async (categoryId: number): Promise<Combo[]> => {
  try {
    const response = await fetch(`${BASE_URL}/Combos/category/${categoryId}`);
    const result: ApiResponse<Combo[]> = await response.json();
    
    if (result.status === 200) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch combos by category');
    }
  } catch (error) {
    console.error('Error fetching combos by category:', error);
    throw error;
  }
};
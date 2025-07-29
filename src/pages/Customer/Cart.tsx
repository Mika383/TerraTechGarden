import React, { useEffect, useState } from 'react';
import {
  getCart,
  deleteCartItem,
  updateCartItem
} from '@/api/cart';
import { getTerrariumVariantById } from '@/api/terrarium';
import { CartItem } from '@/types/cart';
import { groupCartItems } from '@/utils/cartUtils';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const Cart: React.FC = () => {
  const isLoggedIn = !!localStorage.getItem('authToken');
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  const loadCart = async () => {
    if (isLoggedIn) {
      try {
        const res = await getCart();
        const grouped = groupCartItems(res.cartItems).map((item) => ({
          id: item.cartItemId.toString(),
          name: item.item[0].productName,
          price: item.item[0].price,
          quantity: item.totalCartQuantity,
          image: '/default.jpg',
          selected: false,
          cartItemId: item.cartItemId,
          accessoryId: item.accessoryId,
          variantId: item.terrariumVariantId,
        }));
        setCartItems(grouped);
      } catch {
        toast.error('Lỗi khi lấy giỏ hàng');
      }
    } else {
      const local = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartItems(local);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateLocal = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const handleQuantityChange = async (id: string, type: 'increase' | 'decrease') => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    const sameItems = cartItems.filter((i) =>
      item.accessoryId ? i.accessoryId === item.accessoryId : i.variantId === item.variantId
    );

    if (sameItems.length === 0) return;

    let targetItem: CartItem;
    if (type === 'increase') {
      targetItem = sameItems.reduce((a, b) => (a.quantity > b.quantity ? a : b));
      const newQuantity = targetItem.quantity + 1;

      if (isLoggedIn) {
        await updateCartItem(targetItem.cartItemId, {
          accessoryQuantity: targetItem.accessoryId ? newQuantity : 0,
          variantQuantity: targetItem.variantId ? newQuantity : 0,
        });
        loadCart();
      } else {
        const updated = cartItems.map((i) =>
          i.id === targetItem.id ? { ...i, quantity: newQuantity } : i
        );
        updateLocal(updated);
      }
    }

    if (type === 'decrease') {
      targetItem = sameItems.reduce((a, b) => (a.quantity < b.quantity ? a : b));
      const newQuantity = targetItem.quantity - 1;

      if (newQuantity <= 0) {
        setItemToDelete(targetItem);
        setDeleteModalOpen(true);
      } else {
        if (isLoggedIn) {
          await updateCartItem(targetItem.cartItemId, {
            accessoryQuantity: targetItem.accessoryId ? newQuantity : 0,
            variantQuantity: targetItem.variantId ? newQuantity : 0,
          });
          loadCart();
        } else {
          const updated = cartItems.map((i) =>
            i.id === targetItem.id ? { ...i, quantity: newQuantity } : i
          );
          updateLocal(updated);
        }
      }
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      if (isLoggedIn) {
        await deleteCartItem(itemToDelete.cartItemId);
      }
      const updated = cartItems.filter((i) => i.id !== itemToDelete.id);
      isLoggedIn ? setCartItems(updated) : updateLocal(updated);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch {
      toast.error('Xóa thất bại, vui lòng thử lại');
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleRemoveItem = (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    selectedItems.forEach((id) => handleRemoveItem(id));
    setSelectedItems([]);
  };

  const handleViewProduct = async (item: CartItem) => {
    if (item.variantId) {
      const res = await getTerrariumVariantById(item.variantId);
      if (!res) {
        toast.error('Không tìm thấy thông tin variant');
        return;
      }
      navigate(`/terrarium/${res.terrariumId}`);
    } else if (item.accessoryId) {
      navigate(`/accessory/${item.accessoryId}`);
    }
  };

  const totalPrice = cartItems.reduce(
    (total, item) =>
      selectedItems.includes(item.id) ? total + item.price * item.quantity : total,
    0
  );

  return (
    <div className="cart-page px-8 py-6">
      <h2 className="text-3xl font-bold mb-6">🛒 Giỏ hàng của bạn</h2>

      <div className="border border-gray-300 rounded-xl p-6 bg-white shadow-sm">
        {cartItems.length === 0 ? (
          <p className="text-gray-600 text-center">Chưa có sản phẩm nào trong giỏ hàng.</p>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200 text-base">
              <thead className="bg-gray-100 text-lg font-semibold text-gray-800">
                <tr>
                  <th></th>
                  <th className="py-3 text-left">Sản phẩm</th>
                  <th className="py-3 text-center">Giá</th>
                  <th className="py-3 text-center">Số lượng</th>
                  <th className="py-3 text-center">Tổng</th>
                  <th className="py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                      />
                    </td>
                    <td className="flex items-center gap-4 py-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <span className="font-medium">{item.name}</span>
                    </td>
                    <td className="text-center">{item.price.toLocaleString()} VND</td>
                    <td className="text-center">
                      <div className="flex justify-center items-center border border-gray-300 rounded w-fit mx-auto">
                        <button
                          onClick={() => handleQuantityChange(item.id, 'decrease')}
                          className="w-8 h-8 bg-red-100 hover:bg-red-300 flex justify-center items-center text-red-700 rounded-l"
                        >
                          <MinusOutlined />
                        </button>
                        <div className="w-10 h-8 flex items-center justify-center bg-gray-100 text-sm">
                          {item.quantity}
                        </div>
                        <button
                          onClick={() => handleQuantityChange(item.id, 'increase')}
                          className="w-8 h-8 bg-green-100 hover:bg-green-300 flex justify-center items-center text-green-700 rounded-r"
                        >
                          <PlusOutlined />
                        </button>
                      </div>
                    </td>
                    <td className="text-center font-semibold text-green-600">
                      {(item.price * item.quantity).toLocaleString()} VND
                    </td>
                    <td className="text-center flex justify-center gap-2">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <DeleteOutlined />
                      </button>
                      <button
                        onClick={() => handleViewProduct(item)}
                        className="px-3 py-1 border rounded text-blue-600 hover:bg-blue-50 text-sm"
                      >
                        Xem chi tiết sản phẩm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {cartItems.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200">
                <div className="flex gap-4">
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold text-lg"
                    onClick={handleDeleteSelected}
                  >
                    Xóa đã chọn
                  </button>
                  <div className="text-green-700 font-bold text-xl flex items-center">
                    Tổng cộng:{' '}
                    <span className="ml-2">
                      {totalPrice.toLocaleString()} VND
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toast.success('Chức năng thanh toán đang phát triển')}
                  className="bg-yellow-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold text-lg disabled:bg-gray-400"
                  disabled={selectedItems.length === 0}
                >
                  Mua ngay
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ✅ Modal xác nhận xóa */}
      <Modal
        title="Xác nhận xóa sản phẩm?"
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={confirmDeleteItem}
        okText="Xóa"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
      >
        {itemToDelete?.name}
      </Modal>
    </div>
  );
};

export default Cart;

import React, { useEffect, useState } from 'react';
import {
  getCart,
  deleteCartItem,
  deleteAllCartItems,
  updateCartItem,
  getAccessoryById,
  getTerrariumById,
  addTerrariumToCart
} from '@/api';
import { getTerrariumVariantById, getVariantsByTerrariumId } from '@/api';
import { CartItem, RawCartItem } from '@/types';
import { toast } from 'react-toastify';
import { Modal } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ExtendedCartItem extends CartItem {
  terrariumName?: string;
  createdAt?: string;
}

const Cart: React.FC = () => {
  const isLoggedIn = !!localStorage.getItem('authToken');
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<ExtendedCartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [availableVariants, setAvailableVariants] = useState<Record<number, any[]>>({});

  const allSelected = selectedItems.length === cartItems.length && cartItems.length > 0;

  const loadCart = async () => {
    if (isLoggedIn) {
      try {
        const res = await getCart();
        let items = await Promise.all(
          res.cartItems.map(async (raw: RawCartItem) => {

            let imageUrl = '/default.jpg';
            let terrariumName = raw.item[0]?.productName || 'Sản phẩm không tên';

            try {
              if (raw.accessoryId) {
                const acc = await getAccessoryById(raw.accessoryId);
                if (acc?.accessoryImages?.[0]?.imageUrl) {
                  imageUrl = acc.accessoryImages[0].imageUrl;
                }
              } else if (raw.terrariumVariantId) {
                const variant = await getTerrariumVariantById(raw.terrariumVariantId);
                if (variant?.terrariumId) {
                  const terrariumData = await getTerrariumById(variant.terrariumId);
                  if (terrariumData?.terrariumName) {
                    terrariumName = terrariumData.terrariumName;
                  }
                  if (variant?.urlImage) {
                    imageUrl = variant.urlImage;
                  } else if (terrariumData?.terrariumImages?.[0]?.imageUrl) {
                    imageUrl = terrariumData.terrariumImages[0].imageUrl;
                  }
                  const variantsList = await getVariantsByTerrariumId(variant.terrariumId);
                  setAvailableVariants(prev => ({
                    ...prev,
                    [raw.cartItemId]: variantsList
                  }));
                }
              }
            } catch (err) {
              console.warn('Không lấy được dữ liệu sản phẩm:', err);
            }

            return {
              id: raw.cartItemId.toString(),
              terrariumName,
              name: raw.item[0]?.productName || 'Sản phẩm không tên',
              price: raw.item[0]?.price || 0,
              quantity: raw.totalCartQuantity,
              image: imageUrl,
              selected: false,
              cartItemId: raw.cartItemId,
              accessoryId: raw.accessoryId,
              variantId: raw.terrariumVariantId,
              createdAt: raw.createdAt
            };
          })
        );

        items.sort(
          (a: ExtendedCartItem, b: ExtendedCartItem) =>
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );

        setCartItems(items);
      } catch {
        toast.error('Lỗi khi lấy giỏ hàng');
      }
    } else {
      const local: ExtendedCartItem[] = JSON.parse(localStorage.getItem('cartItems') || '[]');
      local.sort(
        (a: ExtendedCartItem, b: ExtendedCartItem) =>
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      );
      setCartItems(local);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleChangeVariant = async (cartItem: CartItem, newVariantId: number) => {
    try {
      await deleteCartItem(cartItem.cartItemId);
      await addTerrariumToCart(newVariantId, cartItem.quantity);
      toast.success('Đã đổi phiên bản sản phẩm');
      await loadCart();
    } catch {
      toast.error('Đổi phiên bản thất bại');
    }
  };

  const updateLocal = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const handleQuantityChange = async (id: string, type: 'increase' | 'decrease') => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    let newQuantity = item.quantity;
    if (type === 'increase') newQuantity++;
    if (type === 'decrease') newQuantity--;

    if (newQuantity <= 0) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
      return;
    }

    if (isLoggedIn) {
      const updatePayload: any = {};
      if (item.accessoryId) {
        updatePayload.accessoryQuantity = newQuantity;
      } else if (item.variantId) {
        updatePayload.variantQuantity = newQuantity;
      }
      try {
        await updateCartItem(item.cartItemId, updatePayload);
        loadCart();
      } catch {
        toast.error('Cập nhật số lượng thất bại');
      }
    } else {
      const updated = cartItems.map((i) =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      );
      updateLocal(updated);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      if (isLoggedIn) {
        await deleteCartItem(itemToDelete.cartItemId);
        await loadCart();
      } else {
        const updated = cartItems.filter((i) => i.id !== itemToDelete.id);
        updateLocal(updated);
      }
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

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.id));
    }
  };

  const handleUnselectAll = () => {
    setSelectedItems([]);
  };

  const handleDeleteAll = async () => {
    try {
      if (isLoggedIn) {
        await deleteAllCartItems();
        await loadCart();
      } else {
        setCartItems([]);
        localStorage.removeItem('cartItems');
      }
      toast.success('Đã xóa toàn bộ giỏ hàng');
    } catch {
      toast.error('Xóa toàn bộ giỏ hàng thất bại');
    }
  };

  const handleBuyNow = () => {
    const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.id));
    if (itemsToCheckout.length === 0) {
      toast.warn('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }
    localStorage.setItem('checkoutItems', JSON.stringify(itemsToCheckout));
    navigate('/checkout');
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
        <p className="text-gray-600 text-center">
          Chưa có sản phẩm nào trong giỏ hàng.
        </p>
      ) : (
        <>
          <table className="min-w-full divide-y divide-gray-200 text-base">
            <thead className="bg-gray-100 text-lg font-semibold text-gray-800">
              <tr>
                <th className="text-center w-16">
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </th>
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
                      className="w-5 h-5"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </td>
                  <td className="flex items-center gap-4 py-4">
                    <img
                      src={item.image}
                      alt={item.terrariumName || item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <div className="font-medium">
                        {item.terrariumName || item.name}
                      </div>
                      {item.variantId && availableVariants[item.cartItemId] && (
                        <select
                          value={item.variantId}
                          onChange={(e) =>
                            handleChangeVariant(item, Number(e.target.value))
                          }
                          className="border rounded p-1 mt-1"
                        >
                          {availableVariants[item.cartItemId].map((v) => (
                            <option
                              key={v.terrariumVariantId}
                              value={v.terrariumVariantId}
                            >
                              {v.variantName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    {item.price.toLocaleString()} VND
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center items-center border border-gray-300 rounded w-fit mx-auto">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, 'decrease')
                        }
                        className="w-8 h-8 bg-red-100 hover:bg-red-300 flex justify-center items-center text-red-700 rounded-l"
                      >
                        <MinusOutlined />
                      </button>
                      <div className="w-10 h-8 flex items-center justify-center bg-gray-100 text-sm">
                        {item.quantity}
                      </div>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, 'increase')
                        }
                        className="w-8 h-8 bg-green-100 hover:bg-green-300 flex justify-center items-center text-green-700 rounded-r"
                      >
                        <PlusOutlined />
                      </button>
                    </div>
                  </td>
                  <td className="text-center font-semibold text-green-600">
                    {(item.price * item.quantity).toLocaleString()} VND
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <DeleteOutlined />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer action */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200">
            <div className="flex gap-4">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold text-lg"
                onClick={handleUnselectAll}
              >
                Bỏ chọn
              </button>
              <button
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded font-semibold text-lg"
                onClick={handleDeleteAll}
              >
                Xóa toàn bộ
              </button>
              <div className="text-green-700 font-bold text-xl flex items-center">
                Tổng cộng:{' '}
                <span className="ml-2">{totalPrice.toLocaleString()} VND</span>
              </div>
            </div>
            <button
              onClick={handleBuyNow}
              className="bg-yellow-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold text-lg disabled:bg-gray-400"
              disabled={selectedItems.length === 0}
            >
              Mua ngay
            </button>
          </div>
        </>
      )}
    </div>

    {/* Modal xác nhận xóa */}
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
}
export default Cart;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../../components/customer/Dashboard/ProfileHeader';
import ReviewSection from '../../components/customer/Dashboard/ReviewSection';
import AddressSection from '../../components/customer/Dashboard/AddressSection'; // Địa chỉ động mới
import OrderItem from '../../components/customer/Dashboard/OrderItem';

// Fake user profile cho demo UI (địa chỉ đã bỏ, các trường còn lại dùng cho các section khác)
const userProfile = {
  name: 'Nguyễn Văn A',
  phone: '+84 123 456 789',
  email: 'nguyenvana@gmail.com',
  avatar: 'https://via.placeholder.com/150',
  backgroundImage: 'https://via.placeholder.com/1200x300',
  reviews: [
    { review: 'Tôi rất thích Terrarium này, dễ chăm sóc và đẹp mắt!', rating: 5 },
    { review: 'Dịch vụ hỗ trợ khách hàng tuyệt vời, giao hàng nhanh.', rating: 4 },
  ],
  orders: [
    {
      name: 'Terrarium mini cây xanh',
      price: 513500,
      image: 'https://via.placeholder.com/100',
      date: '18-06-2025',
      status: 'Hoàn thành',
    },
    {
      name: 'Terrarium mini cây xanh',
      price: 182160,
      image: 'https://via.placeholder.com/100',
      date: '13-06-2025',
      status: 'Hoàn thành',
    },
  ],
};

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12 px-6">
      <ProfileHeader
        name={userProfile.name}
        email={userProfile.email}
        phone={userProfile.phone}
        avatar={userProfile.avatar}
        backgroundImage={userProfile.backgroundImage}
      />
      {/* Địa chỉ động mới */}
      <AddressSection />

      <h2 className="text-2xl font-bold mb-4 mt-8">Đơn Mua</h2>
      {userProfile.orders.map((order, index) => (
        <OrderItem
          key={index}
          name={order.name}
          price={order.price}
          image={order.image}
          date={order.date}
          status={order.status}
        />
      ))}
      <ReviewSection reviews={userProfile.reviews} />
    </div>
  );
};

export default CustomerDashboard;

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import '../styles/product.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
        // Handle both old format (string) and new format (object with url)
        const firstImageUrl = typeof data.images?.[0] === 'string' 
          ? data.images[0] 
          : data.images?.[0]?.url;
        setSelectedImage(firstImageUrl);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      // Extract URL from both old (string) and new (object) format
      const imageUrls = product.images?.map(img => 
        typeof img === 'string' ? img : img.url
      );
      
      dispatch(addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        images: imageUrls,
        imageUrl: imageUrls?.[0],
        qty: 1
      }));
      alert('Successfully added to your cart!');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', margin: '100px', color: '#f97316' }}>Loading Product...</div>;
  if (!product) return <div style={{ textAlign: 'center', margin: '100px', color: '#ef4444' }}>Product Not Found</div>;

  return (
    <div className="product-detail-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Breadcrumb Navigation */}
      <div style={{ color: '#a1a1aa', marginBottom: '20px', fontSize: '0.95rem' }}>
        <Link to="/" style={{ color: '#f97316' }}>Home</Link> / <Link to="/shop" style={{ color: '#f97316' }}>Shop</Link> / {product.category} / <span style={{ color: '#fff' }}>{product.name}</span>
      </div>

      <div className="product-detail">
        {/* Left Side: Image Gallery */}
        <div className="detail-image-container">
          <div style={{ marginBottom: '15px' }}>
            <img src={selectedImage} alt={product.name} className="detail-image" style={{ width: '100%', borderRadius: '8px' }} />
          </div>
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {product.images.map((img, index) => {
                // Handle both old format (string) and new format (object with url)
                const imageUrl = typeof img === 'string' ? img : img.url;
                return (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${product.name} ${index + 1}`}
                    onClick={() => setSelectedImage(imageUrl)}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: selectedImage === imageUrl ? '2px solid #f97316' : '2px solid #27272a',
                      objectFit: 'cover'
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Information Block */}
        <div className="detail-info">
          
          <h2 style={{ fontSize: '2.8rem', marginBottom: '10px' }}>{product.name}</h2>

          <p className="detail-price" style={{ fontSize: '2.5rem', margin: '15px 0' }}>₹{product.price.toFixed(2)}</p>

          {/* Description */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#fff', marginBottom: '10px' }}>Product Description</h4>
            <p style={{ color: '#a1a1aa', lineHeight: '1.8' }}>{product.description}</p>
          </div>

          {/* Cart & Stock Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={handleAddToCart} className="btn" style={{ flexGrow: '1', padding: '18px', fontSize: '1.2rem' }}>
              Add to Shopping Cart
            </button>
          </div>
          
          <p style={{ marginTop: '20px', color: product.stock > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
            {product.stock > 0 ? `● In Stock (${product.stock} units available)` : `● Temporarily Out of Stock`}
          </p>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

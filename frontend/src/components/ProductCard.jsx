import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/product.css';

const ProductCard = ({ product }) => {
  // Handle both old format (string array) and new format (object array with url + public_id)
  const imageUrl = typeof product.images?.[0] === 'string' 
    ? product.images[0] 
    : product.images?.[0]?.url;

  return (
    <div className="product-card">
      <img src={imageUrl} alt={product.name} className="product-image" />
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">₹{product.price}</p>
        <Link to={`/product/${product._id}`} className="btn">View Details</Link>
      </div>
    </div>
  );
};

export default ProductCard;

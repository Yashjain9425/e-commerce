import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', stock: ''
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!images || images.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = Array.from(images).map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // cleanup: revoke object URLs to avoid memory leaks
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return alert('Please select at least one image');
    
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    images.forEach((img) => {
      data.append('images', img);
    });

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: data
      });
      const responseData = await res.json();
      
      if (res.ok) {
        alert('Product created successfully!');
        navigate('/shop');
      } else {
        alert(responseData.message || 'Error creating product');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', background: '#18181b', padding: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h2 style={{ color: '#f97316', marginBottom: '20px' }}>Add New Product</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" placeholder="Product Name" required 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
          style={inputStyle} 
        />
        <textarea 
          placeholder="Description" required rows="4"
          onChange={(e) => setFormData({...formData, description: e.target.value})} 
          style={inputStyle} 
        />
        <input 
          type="number" placeholder="Price" required 
          onChange={(e) => setFormData({...formData, price: e.target.value})} 
          style={inputStyle} 
        />
        <input 
          type="text" placeholder="Category" required 
          onChange={(e) => setFormData({...formData, category: e.target.value})} 
          style={inputStyle} 
        />
        <input 
          type="number" placeholder="Stock Quantity" required 
          onChange={(e) => setFormData({...formData, stock: e.target.value})} 
          style={inputStyle} 
        />
        
        <div style={uploadBoxStyle}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '0.95rem' }}>Upload Product Images - Select Multiple</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              id="product-images-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                setImages((prev) => [...prev, ...files]);
                // allow selecting the same file(s) again by clearing the input
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />

            <label htmlFor="product-images-input" style={uploadButtonStyle}>
              <span style={{ fontSize: 14 }}>Choose images</span>
              <small style={{ marginLeft: 8, opacity: 0.9 }}>{images.length ? `${images.length}` : '0'}</small>
            </label>

            <div style={{ color: images.length ? '#a3e635' : '#a1a1aa', fontSize: 13 }}>{images.length} image(s) selected</div>
          </div>

          {/* Previews */}
          {previewUrls.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              {previewUrls.map((src, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ position: 'relative', width: 92, height: 92, borderRadius: 8, overflow: 'hidden', background: '#0b0b0c', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.03)'}}
                >
                  <img src={src} alt={`preview-${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                  {hovered === idx && (
                    <button
                      onClick={() => removeImageAt(idx)}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Remove image"
                    >
                      <span style={{ fontSize: 18, lineHeight: 1, transform: 'translateY(-1px)' }}>−</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn" style={{ marginTop: '10px' }}>
          {loading ? `Uploading ${images.length} image(s) & Creating...` : 'Publish Product'}
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  padding: '12px',
  background: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '15px',
  outline: 'none'
};

const uploadBoxStyle = {
  padding: '15px',
  borderRadius: '8px',
  border: '1px dashed rgba(249,115,22,0.9)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
};

const uploadButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px 16px',
  background: 'linear-gradient(90deg, #0b0b0c, #111827)',
  color: '#f3f4f6',
  borderRadius: '10px',
  border: '1px solid rgba(249,115,22,0.06)',
  cursor: 'pointer',
  fontWeight: 700,
  boxShadow: '0 6px 18px rgba(2,6,23,0.6)'
};

// generate previews when images change
// move effect here to avoid adding import at top for brevity; but we will add useEffect

export default AddProduct;

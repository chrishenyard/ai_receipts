import React, { useState, useEffect } from 'react';
import './ReceiptForm.css';
import { ReceiptFormData } from '../types/Receipt';
import { Category } from '../types/Category';

interface ReceiptFormProps {
    data: ReceiptFormData;
    categories: Category[];
    onChange: (data: ReceiptFormData) => void;
    onSave: (data: ReceiptFormData) => void;
    onReset: () => void;
    loading: boolean;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({
    data,
    categories,
    onChange,
    onSave,
    onReset,
    loading
}) => {
    const [formData, setFormData] = useState<ReceiptFormData>({
        extractedText: '',
        title: '',
        description: '',
        vendor: '',
        state: '',
        city: '',
        country: '',
        imageUrl: '',
        tax: 0,
        total: 0,
        purchaseDate: '',
        categoryId: 0,
    });

    useEffect(() => {
        if (data) {
            setFormData({
                extractedText: data.extractedText || '',
                title: data.title || '',
                description: data.description || '',
                vendor: data.vendor || '',
                state: data.state || '',
                city: data.city || '',
                country: data.country || '',
                imageUrl: data.imageUrl || '',
                tax: data.tax || 0,
                total: data.total || 0,
                purchaseDate: data.purchaseDate || '',
                categoryId: data.categoryId || 0,
            });
        }
    }, [data]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ): void => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? parseFloat(value) || 0 : value;

        const updatedData: ReceiptFormData = {
            ...formData,
            [name]: newValue,
        };

        setFormData(updatedData);
        onChange(updatedData);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();

        // Validate required fields
        if (!formData.title || !formData.vendor) {
            alert('Title and Vendor are required fields');
            return;
        }

        onSave(formData);
    };

    return (
        <form className="receipt-form" onSubmit={handleSubmit}>
            <h2>Receipt Details</h2>

            <div className="form-grid">
                <div className="form-group full-width">
                    <label htmlFor="title">
                        Title <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        maxLength={100}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={4096}
                        rows={3}
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="vendor">
                        Vendor <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="vendor"
                        name="vendor"
                        value={formData.vendor}
                        onChange={handleChange}
                        maxLength={100}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="categoryId">Category</label>
                    <select
                        id="categoryId"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        disabled={loading}
                    >
                        <option value={0}>Select a category</option>
                        {categories.map((category) => (
                            <option key={category.categoryId} value={category.categoryId}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        maxLength={100}
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        maxLength={100}
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        maxLength={100}
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="purchaseDate">Purchase Date</label>
                    <input
                        type="date"
                        id="purchaseDate"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tax">Tax</label>
                    <input
                        type="number"
                        id="tax"
                        name="tax"
                        value={formData.tax}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="total">Total</label>
                    <input
                        type="number"
                        id="total"
                        name="total"
                        value={formData.total}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        disabled={loading}
                    />
                </div>

                <div className="form-group full-width">
                    <label htmlFor="extractedText">Extracted Text</label>
                    <textarea
                        id="extractedText"
                        name="extractedText"
                        value={formData.extractedText}
                        onChange={handleChange}
                        maxLength={4096}
                        rows={6}
                        disabled={loading}
                        className="monospace"
                    />
                </div>
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onReset}
                    disabled={loading}
                >
                    Reset
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Receipt'}
                </button>
            </div>
        </form>
    );
};

export default ReceiptForm;

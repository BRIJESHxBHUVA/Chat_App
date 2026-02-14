import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'danger' // 'danger' or 'primary'
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm_modal_overlay" onClick={onCancel}>
            <div className="confirm_modal_content" onClick={(e) => e.stopPropagation()}>
                <div className="confirm_modal_header">
                    <h3>{title}</h3>
                </div>
                <div className="confirm_modal_body">
                    <p>{message}</p>
                </div>
                <div className="confirm_modal_footer">
                    <button className="cancel_btn" onClick={onCancel}>{cancelText}</button>
                    <button className={`confirm_btn ${type}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;

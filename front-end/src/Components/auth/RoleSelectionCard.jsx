import React from "react";

const RoleSelectionCard = ({ title, description, icon, onClick }) => {
    return (
        <div className="role-card" onClick={onClick}>
            <div className="role-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
};

export default RoleSelectionCard;
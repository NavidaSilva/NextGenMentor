import { Button } from "@mui/material";
import React from 'react';

const CustomButton = ({ children, type = "button", sx = {},  ...props }) => {
    return (
        <Button
            type={type}
            variant="contained"
            sx={{
                mt: 2,
                color: '#2c3e50', // Set text color
                backgroundColor: '#5fcf80',
                '&:hover': {
                    backgroundColor: 'darkgreen',
                },

                ...sx,
            }}

            {...props}
        >
            {children}
        </Button>
    );
};

export default CustomButton;
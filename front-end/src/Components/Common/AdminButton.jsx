
import React from 'react';
import { Button } from "@mui/material";

const CustomButton = ({ children, type = "button", ...props }) => {
    return (
        <Button
            type={type}
            variant="contained"
            fullWidth
            sx={{
                mt: 1,
                color: '#2c3e50', // Set text color
                backgroundColor: 'lightgreen',
                '&:hover': {
                    backgroundColor: 'darkgreen',
                    color: '#ffffff',
                },
            }}
            {...props}
        >
            {children}
        </Button>
    );
};

export default CustomButton;
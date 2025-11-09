import { Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

import React from 'react';

const GoogleAuthButton = ({ text = "Continue with Google", onClick }) => {
    return (
        <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={onClick}
            sx={{
                mt: 2,
                mb: 2,
                color: "#2c3e50",
                backgroundColor: '#5fcf80',
                '&:hover': {
                    backgroundColor: 'darkgreen',
                },
            }}
        >
            {text}
        </Button>
    );
};

export default GoogleAuthButton;
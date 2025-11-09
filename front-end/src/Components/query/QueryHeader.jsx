import { Box, Typography, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from "../../Components/Common/Button";
import React from "react";

const QueryHeader = ({ query, userRole, onBack }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                textAlign: { xs: 'left', sm: 'center' },
                py: 2,
                borderBottom: '1px solid #ddd',
                mb: 2,
                gap: 2,
            }}
        >
            {/* Left: Back Button */}
            <Box>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                    sx={{
                        borderRadius: 20,
                        fontSize: '0.8rem',
                        px: 2,
                        py: 0.5,
                        textTransform: 'none'
                    }}
                >
                    Back to Dashboard
                </Button>
            </Box>

            {/* Center: Topic and Chip */}
            <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600 , color: '#5fcf80' }}>
                    {query.topic}
                </Typography>
                <Chip
                    label={userRole === 'mentor' ? 'Mentoring' : 'Being Mentored'}
                    size="small"
                    sx={{ mt: 1, backgroundColor: '#5fcf80', color: '#fff' }}
                />
            </Box>

            {/* Right: Created At */}
            <Box>
                <Typography variant="caption" sx={{ color: '#777' }}>
                    Started: {new Date(query.createdAt).toLocaleDateString()}
                </Typography>
            </Box>
        </Box>

    );
};

export default QueryHeader;

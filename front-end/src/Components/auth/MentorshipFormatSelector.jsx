// components/MentorshipFormatSelector.jsx
import React from 'react';
import { RadioGroup, FormControlLabel, Radio } from '@mui/material';

const greenRadioSx = {
    color: '#5fcf80', // unselected circle (dark green)
    '&.Mui-checked': {
        color: '#5fcf80', // selected circle (dark green)
    },
};

const MentorshipFormatSelector = ({ value, onChange }) => {
    return (
        <div className="form-section">
            <h3>Preferred Mentorship Format</h3>
            <RadioGroup name="mentorshipFormat" value={value} onChange={onChange}>
                <FormControlLabel
                    value="chat"
                    control={<Radio sx={greenRadioSx} />}
                    label="Chat"
                />
                <FormControlLabel
                    value="video"
                    control={<Radio sx={greenRadioSx} />}
                    label="Video"
                />
                <FormControlLabel
                    value="both"
                    control={<Radio sx={greenRadioSx} />}
                    label="Both"
                />
            </RadioGroup>
        </div>
    );
};

export default MentorshipFormatSelector;

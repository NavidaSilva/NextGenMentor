import { TextField, Chip, MenuItem } from "@mui/material";
import React from 'react';

const MultiSelectInput = ({ label, name, options, formik }) => {
    return (
        <TextField
            select
            fullWidth
            label={label}
            name={name}
            SelectProps={{
                multiple: true,
                renderValue: (selected) => (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                        ))}
                    </div>
                ),
            }}
            value={formik.values[name]}
            onChange={(e) => formik.setFieldValue(name, e.target.value)}
            margin="normal"
            error={formik.touched[name] && Boolean(formik.errors[name])}
            helperText={formik.touched[name] && formik.errors[name]}
        >
            {options.map((option) => (
                <MenuItem key={option} value={option}>
                    {option}
                </MenuItem>
            ))}
        </TextField>
    );
};

export default MultiSelectInput;
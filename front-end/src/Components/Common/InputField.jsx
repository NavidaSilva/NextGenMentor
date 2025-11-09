import { TextField } from "@mui/material";
import React from 'react';

const InputField = ({ label, type = "text", name, formik }) => {
    return (
        <TextField
            fullWidth
            label={label}
            type={type}
            name={name}
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[name] && Boolean(formik.errors[name])}
            helperText={formik.touched[name] && formik.errors[name]}
            margin="normal"
        />
    );
};

export default InputField;
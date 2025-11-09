import { Button, Typography } from "@mui/material";
import React from 'react';

const FileUpload = ({ label, name, formik }) => {
    return (
        <div className="file-upload">
            <Typography variant="subtitle1" gutterBottom>
                {label}
            </Typography>
            <input
                type="file"
                id={name}
                name={name}
                accept="image/*"
                onChange={(e) => formik.setFieldValue(name, e.target.files[0])}
                style={{ display: "none" }}
            />
            <label htmlFor={name}>
                <Button variant="outlined" component="span">
                    Upload File
                </Button>
            </label>
            {formik.values[name] && (
                <Typography variant="caption" display="block">
                    {formik.values[name].name}
                </Typography>
            )}
        </div>
    );
};

export default FileUpload;
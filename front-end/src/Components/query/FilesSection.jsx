import { useState } from "react";
import axios from "axios";
import { List, ListItem, Typography, Box, IconButton } from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import Button from "../Common/Button";
import React from "react";

const FilesSection = ({ files = [], queryId, reload }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("File exceeds 100MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.post(`http://localhost:5000/queries/${queryId}/files`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      reload();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to upload");
    }
    setUploading(false);
  };

  const handleDelete = async (fileId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/queries/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      reload();
    } catch (err) {
    alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const handleDownload = (fileId) => {
  const token = localStorage.getItem("token");
  const url = `http://localhost:5000/queries/files/${fileId}`;

  // open in new tab
  window.open(`${url}?token=${token}`, "_blank");
};


  


  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Shared Files</Typography>
        <Button
          component="label"
          variant="outlined"
          size="small"
          sx={{ borderRadius: 20 }}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload New File"}
          <input type="file" hidden onChange={handleUpload} />
        </Button>
      </Box>

      <List>
        {files.map((file) => (
          <ListItem key={file._id} sx={{ display: "flex", alignItems: "center" }}>
            <InsertDriveFileIcon />
            <Typography sx={{ ml: 1, flex: 1 }}>{file.name}</Typography>
            <Typography sx={{ mr: 2, color: "gray" }}>
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </Typography>
            <IconButton onClick={() => handleDownload(file._id)}>
              <CloudDownloadIcon />
            </IconButton>
            <IconButton onClick={() => handleDelete(file._id)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default FilesSection;

// FilesSection.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FilesSection from "../Components/query/FilesSection";
import axios from "axios";

// Mock axios
jest.mock("axios");

describe("FilesSection", () => {
  const mockReload = jest.fn();
  const mockFiles = [
    { _id: "1", name: "test.pdf", size: 1024 * 1024 * 2 }, // 2 MB
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "fake-token");
  });

  it("renders file list correctly", () => {
    render(<FilesSection files={mockFiles} queryId="q1" reload={mockReload} />);
    expect(screen.getByText("Shared Files")).toBeInTheDocument();
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.0 MB")).toBeInTheDocument();
  });

  it("calls axios.delete when deleting a file", async () => {
    axios.delete.mockResolvedValueOnce({});
    render(<FilesSection files={mockFiles} queryId="q1" reload={mockReload} />);

    // Find the DeleteIcon button using data-testid
    fireEvent.click(screen.getByTestId("DeleteIcon"));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:5000/queries/files/1",
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        })
      );
      expect(mockReload).toHaveBeenCalled();
    });
  });

  it("opens new tab on download", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => {});
    render(<FilesSection files={mockFiles} queryId="q1" reload={mockReload} />);

    // Find the CloudDownloadIcon button using data-testid
    fireEvent.click(screen.getByTestId("CloudDownloadIcon"));

    expect(openSpy).toHaveBeenCalledWith(
      "http://localhost:5000/queries/files/1?token=fake-token",
      "_blank"
    );
    openSpy.mockRestore();
  });

  it("uploads file when selected", async () => {
    axios.post.mockResolvedValueOnce({});
    render(<FilesSection files={[]} queryId="q1" reload={mockReload} />);

    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    // Get the input directly using getByRole with hidden option
    const input = screen.getByRole("button", { name: /upload new file/i }).querySelector("input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/queries/q1/files",
        expect.any(FormData),
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        })
      );
      expect(mockReload).toHaveBeenCalled();
    });
  });
});
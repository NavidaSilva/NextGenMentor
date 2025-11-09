import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSearchParams, useNavigate } from "react-router-dom";
import InputField from "../../Components/Common/InputField";
import Button from "../../Components/Common/Button";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);
    const [tokenError, setTokenError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);

    const token = searchParams.get("token");

    // Verify token on component mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenError("No reset token provided");
                setIsVerifying(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/admin/verify-reset-token/${token}`);
                const data = await response.json();
                
                if (response.ok) {
                    setIsValidToken(true);
                } else {
                    setTokenError(data.error || "Invalid or expired token");
                }
            } catch (error) {
                console.error("Token verification error:", error);
                setTokenError("Failed to verify token");
            } finally {
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const formik = useFormik({
        initialValues: {
            newPassword: "",
            confirmPassword: "",
        },
        validationSchema: Yup.object({
            newPassword: Yup.string()
                .min(6, "Password must be at least 6 characters")
                .required("Password is required"),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
                .required("Please confirm your password"),
        }),
        onSubmit: async (values) => {
            setIsLoading(true);
            try {
                const response = await fetch("http://localhost:5000/admin/reset-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: token,
                        newPassword: values.newPassword,
                    }),
                });
                
                const data = await response.json();
                if (response.ok) {
                    setSuccess(true);
                    setTimeout(() => {
                        navigate("/login");
                    }, 3000);
                } else {
                    alert(data.error || "Failed to reset password");
                }
            } catch (error) {
                console.error("Password reset error:", error);
                alert("Failed to reset password. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
    });

    if (isVerifying) {
        return (
            <div className="auth-container">
                <h1>Verifying Reset Token</h1>
                <p>Please wait while we verify your reset token...</p>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="auth-container">
                <h1>Invalid Reset Link</h1>
                <p style={{ color: "red" }}>{tokenError}</p>
                <p>The reset link may have expired or is invalid.</p>
                <Button onClick={() => navigate("/login")}>
                    Back to Login
                </Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="auth-container">
                <h1>Password Reset Successful</h1>
                <p style={{ color: "green" }}>
                    Your password has been reset successfully. You will be redirected to the login page shortly.
                </p>
                <Button onClick={() => navigate("/login")}>
                    Go to Login
                </Button>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <h1>Reset Your Password</h1>
            <p>Please enter your new password below.</p>
            
            <form onSubmit={formik.handleSubmit}>
                <InputField
                    label="New Password"
                    name="newPassword"
                    type="password"
                    formik={formik}
                />

                <InputField
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    formik={formik}
                />

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
            </form>

            <p style={{ marginTop: "1rem" }}>
                <button
                    type="button"
                    onClick={() => navigate("/login")}
                    style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", padding: 0 }}
                >
                    Back to Login
                </button>
            </p>
        </div>
    );
};

export default ResetPassword;

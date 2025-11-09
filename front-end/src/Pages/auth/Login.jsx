import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../Components/Common/InputField";
import Button from "../../Components/Common/Button";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        },
        validationSchema: Yup.object({
            email: Yup.string().email("Invalid email").required("Required"),
            password: Yup.string().required("Required"),
        }),
        onSubmit: async (values) => {
            setIsLoading(true);
            try {
                // First check if user is admin
                const adminResponse = await fetch(`http://localhost:5000/admin/check/${values.email}`);
                const adminData = await adminResponse.json();
                
                if (adminData.isAdmin) {
                    // User is admin, log them in
                    const loginResponse = await fetch("http://localhost:5000/admin/login", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email: values.email, password: values.password }),
                    });
                    
                    const loginData = await loginResponse.json();
                    if (loginResponse.ok) {
                        localStorage.setItem("token", loginData.token);
                        navigate("/admin");
                    } else {
                        alert(loginData.error || "Admin login failed");
                    }
                } else {
                    // Check if user is mentor or mentee (you'll need to implement these routes)
                    // For now, show error
                    alert("User not found or not authorized. Please sign up first.");
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("Login failed. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
    });

    const forgotPasswordFormik = useFormik({
        initialValues: {
            email: "",
        },
        validationSchema: Yup.object({
            email: Yup.string().email("Invalid email").required("Required"),
        }),
        onSubmit: async (values) => {
            setIsLoading(true);
            try {
                const response = await fetch("http://localhost:5000/admin/forgot-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: values.email }),
                });
                
                const data = await response.json();
                if (response.ok) {
                    setEmailSent(true);
                } else {
                    alert(data.error || "Failed to send reset email");
                }
            } catch (error) {
                console.error("Forgot password error:", error);
                alert("Failed to send reset email. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
    });



    return (
        <div className="auth-container">
            <h1>Login</h1>
            <form onSubmit={formik.handleSubmit}>
                <InputField
                    label="Email"
                    name="email"
                    type="email"
                    formik={formik}
                />

                <InputField
                    label="Password"
                    name="password"
                    type="password"
                    formik={formik}
                />

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                </Button>
            </form>

            <p style={{ marginTop: "1rem" }}>
                <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", padding: 0 }}
                >
                    Forgot Password?
                </button>
            </p>

            {showForgotPassword && (
                <form onSubmit={forgotPasswordFormik.handleSubmit} style={{ marginTop: "1rem" }}>
                    <InputField
                        label="Enter your email"
                        name="email"
                        type="email"
                        formik={forgotPasswordFormik}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    {emailSent && <p style={{ color: "green" }}>Reset link sent to your email.</p>}
                </form>
            )}


        </div>
    );
};

export default Login;

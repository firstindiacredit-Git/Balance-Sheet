import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message, Steps } from "antd";
import {
  MailOutlined,
  LockOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;
const { Step } = Steps;

function ForgotPassword() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const handleSendOTP = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post("/auth/forgot-password", {
        email: values.email,
      });

      setEmail(values.email);
      message.success("OTP sent to your email address");
      setCurrentStep(1);
    } catch (error) {
      console.error("Send OTP error:", error);

      if (error.response?.data?.accountType === "google") {
        message.error(
          "This account was created with Google. Please use the 'Continue with Google' button on the login page."
        );
      } else {
        message.error(error.response?.data?.error || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post("/auth/verify-otp", {
        email: email,
        otp: values.otp,
      });

      setResetToken(response.data.resetToken);
      message.success("OTP verified successfully");
      setCurrentStep(2);
    } catch (error) {
      console.error("Verify OTP error:", error);
      message.error(error.response?.data?.error || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    try {
      setLoading(true);
      await axios.post("/auth/reset-password", {
        resetToken: resetToken,
        newPassword: values.newPassword,
      });

      message.success("Password reset successfully");
      navigate("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      message.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Enter Email",
      icon: <MailOutlined />,
    },
    {
      title: "Verify OTP",
      icon: <CheckCircleOutlined />,
    },
    {
      title: "Reset Password",
      icon: <LockOutlined />,
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form form={form} onFinish={handleSendOTP} layout="vertical">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email address"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Send OTP
              </Button>
            </Form.Item>
          </Form>
        );

      case 1:
        return (
          <Form form={form} onFinish={handleVerifyOTP} layout="vertical">
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Text>We've sent a 6-digit code to:</Text>
              <br />
              <Text strong>{email}</Text>
            </div>
            <Form.Item
              name="otp"
              label="Enter OTP"
              rules={[
                { required: true, message: "Please input the OTP!" },
                { len: 6, message: "OTP must be 6 digits!" },
              ]}
            >
              <Input
                placeholder="Enter 6-digit OTP"
                size="large"
                maxLength={6}
                style={{
                  textAlign: "center",
                  fontSize: "18px",
                  letterSpacing: "8px",
                }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Verify OTP
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="link" onClick={() => setCurrentStep(0)} block>
                Back to Email
              </Button>
            </Form.Item>
          </Form>
        );

      case 2:
        return (
          <Form form={form} onFinish={handleResetPassword} layout="vertical">
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Please input your new password!" },
                { min: 6, message: "Password must be at least 6 characters!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 400, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2}>Forgot Password</Title>
          <Text type="secondary">
            Reset your password using OTP verification
          </Text>
          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: "#f0f8ff",
              borderRadius: 6,
              border: "1px solid #d6e4ff",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 <strong>Note:</strong> If you created your account using
              Google, please use the "Continue with Google" button on the login
              page instead.
            </Text>
          </div>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        {renderStepContent()}

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button type="link" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ForgotPassword;

import React from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message, Divider } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

const { Title } = Typography;

function Login() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoginLoading(true);
      console.log("Login form submitted with values:", {
        username: values.username,
      });

      const result = await login(values.username, values.password);
      console.log("Login result:", result);

      if (result.success) {
        message.success("Login successful!");
        navigate("/dashboard");
      } else {
        message.error(result.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      message.error(err.message || "An error occurred during login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const loadingMessage = message.loading("Connecting to Google...", 0);
      const result = await googleLogin();
      loadingMessage(); // Clear loading message

      if (result.success) {
        message.success("Google login successful!");
        navigate("/dashboard");
      } else {
        message.error(result.error || "Google login failed. Please try again.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      message.error("An error occurred during Google login");
    } finally {
      setGoogleLoading(false);
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
          <Title level={2}>Login</Title>
        </div>

        {/* Google Login Button */}
        <Button
          type="default"
          size="large"
          block
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          loading={googleLoading}
          disabled={googleLoading}
          style={{
            marginBottom: 16,
            height: 48,
            fontSize: 16,
            borderColor: "#d9d9d9",
            color: "#333",
            backgroundColor: "#fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => {
            if (!googleLoading) {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.borderColor = "#40a9ff";
            }
          }}
          onMouseLeave={(e) => {
            if (!googleLoading) {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#d9d9d9";
            }
          }}
        >
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </Button>

        <Divider style={{ margin: "16px 0" }}>
          <span style={{ color: "#666", fontSize: 14 }}>or</span>
        </Divider>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark={false}
          disabled={loginLoading}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Please input your username!" },
              { min: 3, message: "Username must be at least 3 characters!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please input your password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loginLoading}
              disabled={loginLoading}
            >
              {loginLoading ? "Logging in..." : "Login"}
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              type="link"
              onClick={() => navigate("/forgot-password")}
              style={{ float: "left" }}
            >
              Forgot Password?
            </Button>
            <Button
              type="link"
              onClick={() => navigate("/register")}
              style={{ float: "right" }}
            >
              Don't have an account? Register
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;

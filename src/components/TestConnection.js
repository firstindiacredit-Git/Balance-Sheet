import React, { useState } from "react";
import { Button, Card, Typography, message } from "antd";
import axios from "axios";

const { Title, Text } = Typography;

function TestConnection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testConnection = async () => {
    try {
      setLoading(true);
      setResult(null);

      console.log("Testing connection to:", axios.defaults.baseURL);

      const response = await axios.get("/test");
      console.log("Test response:", response.data);

      setResult(response.data);
      message.success("Connection successful!");
    } catch (error) {
      console.error("Connection test error:", error);
      setResult({
        error: error.message,
        code: error.code,
        response: error.response?.data,
      });
      message.error("Connection failed: " + error.message);
    } finally {
      setLoading(false);
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
      <Card style={{ width: 500, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2}>Backend Connection Test</Title>
          <Text type="secondary">Testing connection to backend server</Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>Base URL:</Text> {axios.defaults.baseURL}
        </div>

        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={testConnection}
        >
          Test Connection
        </Button>

        {result && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Result:</Text>
            <pre
              style={{
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 4,
                marginTop: 8,
                fontSize: 12,
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}

export default TestConnection;

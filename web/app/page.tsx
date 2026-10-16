"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Package,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "forecast" | "alerts"
  >("overview");

  const stats = [
    {
      label: "Active Catalog",
      value: "28 Products",
      change: "+4 this month",
      icon: Package,
      color: "var(--accent-cyan)",
    },
    {
      label: "Reorder Forecast",
      value: "4 Pending",
      change: "MAE 0.42 (Linear Reg)",
      icon: TrendingUp,
      color: "var(--accent-indigo)",
    },
    {
      label: "Near Expiry",
      value: "3 Items",
      change: "Next 7 days",
      icon: Calendar,
      color: "var(--accent-amber)",
    },
    {
      label: "Stock Alerts",
      value: "2 Depleted",
      change: "Below safety level",
      icon: AlertTriangle,
      color: "var(--accent-rose)",
    },
  ];

  const criticalItems = [
    {
      name: "Fresh Whole Milk 2L",
      sku: "PD-MLK-04",
      stock: 12,
      reorderLevel: 25,
      expiry: "3 days left",
      status: "LOW_STOCK",
    },
    {
      name: "Pure Orange Juice 1L",
      sku: "APX-OJ-04",
      stock: 8,
      reorderLevel: 15,
      expiry: "4 days left",
      status: "CRITICAL",
    },
    {
      name: "Whole Grain Bread 500g",
      sku: "GV-BRD-02",
      stock: 5,
      reorderLevel: 15,
      expiry: "Expired 2d ago",
      status: "EXPIRED",
    },
    {
      name: "Greek Yogurt 500g",
      sku: "PD-YOG-01",
      stock: 18,
      reorderLevel: 20,
      expiry: "5 days left",
      status: "WARNING",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 24px",
        maxWidth: "1280px",
        margin: "0 auto",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "36px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #06b6d4, #6366f1)",
                borderRadius: "10px",
                padding: "8px",
                display: "flex",
              }}
            >
              <Layers size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>ShelfSense</h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "6px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#818cf8",
                fontWeight: 600,
              }}
            >
              Turborepo 2.x • ESM
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Intelligent inventory ledger, automated expiry safeguards, and
            machine-learning reorder forecasts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} /> Sync
          </button>
          <button className="btn-primary">
            <ShoppingCart size={16} /> Create PO
          </button>
        </div>
      </header>

      {/* Metric Cards Grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "36px",
        }}
      >
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </span>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "6px",
                    borderRadius: "8px",
                    color: s.color,
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  marginBottom: "6px",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {s.change}
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Content Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px",
        }}
      >
        {/* ML Forecast & Reorder Engine Panel */}
        <section className="glass-panel" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={20} color="var(--accent-indigo)" />
              <h2 style={{ fontSize: "1.2rem" }}>AI/ML Demand Forecast</h2>
            </div>
            <span className="status-badge badge-healthy">Active Engine</span>
          </div>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              marginBottom: "20px",
              lineHeight: "1.5",
            }}
          >
            Linear Regression Strategy aggregates 90 days of daily sales,
            applies zero-filled gaps, and computes expected demand with holdout
            MAE validation.
          </p>

          <div
            style={{
              background: "rgba(10, 13, 20, 0.6)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              border: "1px solid var(--border-subtle)",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
              >
                Selected Strategy:
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#a5b4fc",
                }}
              >
                LinearRegressionStrategy
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
              >
                Evaluation Window:
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                14 Days Holdout
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
              >
                Baseline Benchmark:
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--accent-emerald)",
                }}
              >
                +24.8% vs Naive
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-secondary"
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              View Evaluation Table <ArrowUpRight size={14} />
            </button>
          </div>
        </section>

        {/* Inventory Guard & Expiry Watchlist */}
        <section className="glass-panel" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={20} color="var(--accent-amber)" />
              <h2 style={{ fontSize: "1.2rem" }}>Watchlist & Safeguards</h2>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Auto-updating
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {criticalItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(10, 13, 20, 0.4)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                    {item.name}
                  </div>
                  <div
                    style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                  >
                    SKU: {item.sku} • Stock:{" "}
                    <span style={{ color: "#fff", fontWeight: 600 }}>
                      {item.stock}
                    </span>{" "}
                    (Min: {item.reorderLevel})
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    className={`status-badge ${
                      item.status === "EXPIRED"
                        ? "badge-expired"
                        : item.status === "LOW_STOCK" ||
                            item.status === "CRITICAL"
                          ? "badge-low-stock"
                          : "badge-healthy"
                    }`}
                  >
                    {item.expiry}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

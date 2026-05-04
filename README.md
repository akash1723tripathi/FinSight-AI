# FinSight AI — Multi-modal Stock Prediction System

> Final Year B.Tech Capstone Project | JSS Academy of Technical Education, Noida | May 2026

A live demo of a hybrid stock prediction system combining real-time market data, FinBERT sentiment analysis, and ensemble modeling to generate Buy/Sell/Hold signals for AAPL, GOOGL, and TSLA.

---

## 🚀 Live Demo

**[Fin Sight AI](https://fin-sight-ai-chi.vercel.app/)

---

## What It Does

- **Real stock data** via Yahoo Finance — price charts, technical indicators (RSI, MACD, Bollinger Bands)
- **Real sentiment analysis** via HuggingFace FinBERT — reads live financial news and scores it positive/negative/neutral
- **Ensemble prediction** — weighted combination of TLSTM (α=0.51), LSTM (β=0.30), XGBoost (γ=0.20)
- **Trading signals** — BUY / SELL / HOLD with confidence scores
- **Evaluation results** — model comparison table, backtest chart, ablation study visuals

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & API | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Stock Data | yahoo-finance2 |
| News | NewsAPI |
| Sentiment Model | HuggingFace — ProsusAI/finbert |
| Deployment | Vercel |

---

## Getting Started

```bash
git clone https://github.com/yourusername/stocksense-ai
cd stocksense-ai
npm install
```

Create `.env.local` in root:

```env
NEWSAPI_KEY=your_newsapi_key
HF_TOKEN=your_huggingface_token
```

```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
app/
├── page.tsx          # Dashboard — live charts + sentiment
├── prediction/       # Run live prediction for any ticker
└── results/          # Evaluation results + backtest charts
```

---

## Research Paper Results

| Model | RMSE | R² Score |
|---|---|---|
| Standard LSTM | 3.452 | 0.824 |
| XGBoost | 3.105 | 0.851 |
| Hybrid LSTM + VADER | 2.850 | 0.887 |
| **Our System (FinBERT + TLSTM)** | **2.341** | **0.942** |

Trading backtest (2015–2025): **315.6% total return** | Sharpe Ratio **2.45** | Max Drawdown **-12.4%**

---

## Team

**Akash Tripathi** · Divya Mishra · Harsh Jain · Ishita Sachan · Kartik Vats    

Supervised by **Ms. Anuradha Singh** — Dept. of CSE (Data Science), JSS Academy

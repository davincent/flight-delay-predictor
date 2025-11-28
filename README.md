# Flight Delay Predictor

Real-time flight delay prediction system using deep learning and live data feeds.

## Project Overview

A capstone project demonstrating end-to-end machine learning deployment:
- **Data Science:** PyTorch neural network trained on 7M+ flight records
- **Backend:** ASP.NET Core inference API with ONNX Runtime
- **Frontend:** Blazor Server dashboard with real-time updates
- **DevOps:** Fully containerized with Docker and deployable to Kubernetes

## Architecture
```
┌─────────────────────┐
│  Data Collector     │  ← Python container (FlightAware API)
│  (Live flight data) │     Stores in PostgreSQL
└─────────────────────┘

┌─────────────────────┐
│  Model Trainer      │  ← Python container (PyTorch)
│  (Scheduled job)    │     Trains/fine-tunes model → ONNX
└─────────────────────┘

┌─────────────────────┐
│  Inference API      │  ← ASP.NET Core (ONNX Runtime)
│  (C# REST API)      │     Loads ONNX model, serves predictions
└─────────────────────┘

┌─────────────────────┐
│  Blazor Dashboard   │  ← Blazor Server (MudBlazor)
│  (Real-time UI)     │     SignalR updates, live predictions
└─────────────────────┘
```

## Dataset

- **Source:** [Kaggle - Flight Delay Dataset 2024](https://www.kaggle.com/datasets/hrishitpatil/flight-data-2024)
- **Size:** 7,079,081 flights
- **Features:** 35 columns (temporal, geographic, operational)
- **Target:** Binary classification (delayed >15 min)

## Model Performance

| Metric | Score |
|--------|-------|
| Accuracy | TBD% |
| F1-Score | TBD |
| ROC-AUC | TBD |

*(To be updated after training)*

## Tech Stack

### Machine Learning
- **Training:** Python 3.11, PyTorch 2.1, scikit-learn
- **Export:** ONNX 1.15
- **Inference:** ONNX Runtime (C#)

### Backend
- **API:** ASP.NET Core 8.0
- **Database:** PostgreSQL 15
- **Containerization:** Docker, docker-compose

### Frontend
- **Framework:** Blazor Server
- **UI Library:** MudBlazor
- **Real-time:** SignalR

### DevOps
- **Container Orchestration:** Docker Compose (dev), Kubernetes (prod)
- **Deployment:** k3s homelab cluster
- **Networking:** Cloudflare tunnels

## Project Structure
```
flight-delay-predictor/
├── notebooks/              # Jupyter notebooks (EDA, training)
├── data/                   # Data storage (not in git)
│   ├── raw/               # Original datasets
│   ├── processed/         # Cleaned/transformed data
│   └── models/            # Trained models (ONNX)
├── python/                # Python microservices
│   ├── data_collector/
│   └── model_trainer/
├── dotnet/                # C# .NET projects
│   ├── FlightPredictor.API/
│   └── FlightPredictor.Web/
├── docker/                # Docker configuration
└── docs/                  # Documentation
```

## Getting Started

### Prerequisites
- Python 3.11+
- .NET 8.0 SDK
- Docker & docker-compose
- GPU (optional, for faster training)

### Development Setup

1. **Clone the repository:**
```bash
   git clone https://github.com/yourusername/flight-delay-predictor.git
   cd flight-delay-predictor
```

2. **Python environment:**
```bash
   python -m venv venv
   venv\Scripts\activate.bat  # Windows
   pip install -r requirements.txt
```

3. **Download dataset:**
   - Get data from [Kaggle](https://www.kaggle.com/datasets/hrishitpatil/flight-data-2024)
   - Place in `data/raw/flight_data_2024.csv`

4. **Run notebooks:**
```bash
   jupyter notebook
   # Run 01_initial_eda.ipynb → 02_feature_engineering.ipynb → 03_model_training.ipynb
```

## Development Timeline

- **Week 1:** Data exploration, feature engineering, model training
- **Week 2:** C# inference API, ONNX integration
- **Week 3:** Blazor dashboard, real-time updates
- **Week 4:** Containerization, deployment, continuous learning

## Author

**Daniel** - Computer Science Student, Full Sail University  
AI Concentration - Deep Learning Capstone Project

## License

This project is for educational purposes.

## Acknowledgments

- Department of Transportation (DOT) for flight data standards
- Kaggle community for dataset curation
- Full Sail University - Deep Learning course
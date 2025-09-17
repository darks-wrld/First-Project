# Mapping and Risk Prediction Tool (MRPT) - System Architecture

## 1. Introduction

This document outlines the system architecture for the Mapping and Risk Prediction Tool (MRPT), a full-stack web application designed to detect, map, and predict illegal mining (galamsey) activities in Ghana. The system integrates GIS mapping, data analytics, machine learning, and community reporting to provide a comprehensive decision-support tool.

## 2. System Architecture & Technology Stack

The application follows a microservices-oriented architecture, separating the frontend, backend, and machine learning components. This promotes modularity, scalability, and independent development.

![System Architecture Diagram](docs/architecture_diagram.png)
*(Note: A diagram will be added to the `docs` folder later to visualize this flow).*

### 2.1. Component Breakdown

*   **Frontend:** A single-page application (SPA) providing the user interface.
*   **Backend:** A core API server handling business logic, user authentication, and data management.
*   **Databases:** A dual-database system to handle relational/spatial data and unstructured/document data.
*   **ML Service:** A dedicated service for running computationally intensive data processing and serving machine learning model predictions.

### 2.2. Technology Stack

| Component         | Technology                               | Rationale                                                              |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| **Frontend**      | React.js, Vite, Leaflet.js, Tailwind CSS | Modern, efficient, and great for interactive UIs and maps.             |
| **Backend API**   | Python, FastAPI                          | High performance, async support, great for building APIs quickly.      |
| **ML Service**    | Python, FastAPI, Scikit-learn, Rasterio  | Python's strong data science ecosystem is ideal for ML tasks.          |
| **GIS Database**  | PostgreSQL + PostGIS                     | Industry standard for reliable, transactional, and spatial data storage. |
| **Document DB**   | MongoDB                                  | Flexible schema, ideal for user-generated content like reports.        |
| **Deployment**    | Docker, Kubernetes, AWS (S3, RDS, ECR)   | Containerization for consistency and scalability in a cloud environment. |

## 3. Data Flow

1.  **Data Ingestion:**
    *   **Geospatial Data:** Admins upload satellite imagery, shapefiles, and other GIS data (e.g., river networks, protected zones) via a dashboard. This data is stored in a raw format in an S3 bucket.
    *   **Community Reports:** Users submit reports (text, photo, GPS coordinates) via the web app. These are stored in MongoDB.
2.  **Data Processing (ML Service):**
    *   A scheduled or manually triggered process fetches raw geospatial data from S3.
    *   It uses tools like GDAL and Rasterio to preprocess the data (e.g., align projections, normalize raster values, create vegetation indices).
    *   Processed data is stored in the PostGIS database as distinct layers.
3.  **Model Training & Prediction:**
    *   The ML service uses the processed data from PostGIS to train a risk prediction model (e.g., Random Forest).
    *   The trained model predicts a galamsey risk score (0-1) for each grid cell in the map.
    *   These predictions are stored in PostGIS, linked to a specific geometry.
4.  **Data Serving (Backend API):**
    *   The frontend requests data from the Backend API.
    *   The API queries the PostGIS database for vector/raster layers and risk predictions.
    *   It queries MongoDB for community reports.
    *   It serves this data to the frontend in efficient formats (e.g., GeoJSON, Vector Tiles).
5.  **Visualization (Frontend):**
    *   The React app uses Leaflet.js to render the base map and overlays the data layers received from the API.
    *   Risk predictions are visualized as a heatmap.

## 4. Backend API Design

The API will be designed following RESTful principles.

*   **Base URL:** `https://api.mrpt.gov.gh/api/v1/`
*   **Authentication:** JWT (JSON Web Tokens) will be used for securing endpoints. A token is obtained via `/api/v1/auth/login` and sent in the `Authorization` header for subsequent requests.
*   **Role-Based Access Control (RBAC):**
    *   **Admin:** Full access. Can manage users, verify reports, and trigger data processing.
    *   **Researcher:** Can access all data and analytics but cannot modify system settings.
    *   **Community User:** Can submit reports and view public map layers.
*   **Core Endpoints:**
    *   `POST /auth/register`
    *   `POST /auth/login`
    *   `GET /users/me`
    *   `GET /reports` (list all verified reports)
    *   `POST /reports` (submit a new report)
    *   `PUT /reports/{report_id}/verify` (Admin only)
    *   `GET /gis/layers` (get list of available map layers)
    *   `GET /gis/layers/{layer_name}` (get GeoJSON data for a layer)
    *   `GET /predictions/risk-heatmap` (get risk prediction data)

## 5. Database Schema

### 5.1. PostgreSQL + PostGIS Schema

**`users` table:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'community', -- 'community', 'researcher', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**`gis_layers` table:**
```sql
CREATE TABLE gis_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- e.g., 'vector', 'raster'
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**`risk_predictions` table:**
```sql
CREATE TABLE risk_predictions (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Polygon, 4326) NOT NULL, -- The grid cell
    risk_score FLOAT NOT NULL,
    model_version VARCHAR(50),
    prediction_date DATE NOT NULL,
    CONSTRAINT chk_risk_score CHECK (risk_score >= 0 AND risk_score <= 1)
);
CREATE INDEX idx_risk_predictions_geom ON risk_predictions USING GIST (geom);
```

### 5.2. MongoDB Schema

**`community_reports` collection:**
This collection will store user-submitted reports. A flexible schema is ideal here.

```json
{
  "_id": "ObjectId('...')",
  "user_id": 123, // Foreign key to PostgreSQL users table
  "location": {
    "type": "Point",
    "coordinates": [-1.6163, 5.3582] // [longitude, latitude]
  },
  "description": "Suspected mining activity near the Pra River.",
  "photo_url": "https://mrpt-media.s3.amazonaws.com/report_images/xyz.jpg",
  "status": "pending_verification", // 'pending_verification', 'verified', 'rejected'
  "submitted_at": "2025-09-18T10:00:00Z",
  "verified_by": null, // Admin user_id
  "verified_at": null
}
```

## 6. Machine Learning Pipeline

1.  **Data Ingestion:** Collect data from PostGIS (ground truth sites, features) and S3 (raw satellite imagery).
2.  **Preprocessing:**
    *   **Satellite Imagery:** Cloud masking, atmospheric correction.
    *   **Feature Extraction:** Calculate indices like NDVI (vegetation), NDWI (water). Extract features from DEM like slope and aspect.
3.  **Feature Engineering:** Create a feature vector for each point/grid cell. This includes raster values, distance to rivers, distance to roads, soil type, etc.
4.  **Model Training:** Train a classifier (e.g., Random Forest) on a labeled dataset of known mining and non-mining locations.
5.  **Prediction:** Use the trained model to predict the risk score for all grid cells across the country.
6.  **Model Serving:** The trained model is saved and loaded by the ML service (FastAPI) to provide predictions via a REST API endpoint.

## 7. Deployment Plan

1.  **Containerization:** Each service (Frontend, Backend, ML) will have its own `Dockerfile`. A `docker-compose.yml` file will orchestrate the services for local development.
2.  **Cloud Hosting (AWS):**
    *   **ECR (Elastic Container Registry):** Store Docker images.
    *   **ECS (Elastic Container Service) or EKS (Kubernetes):** Run the containerized applications.
    *   **RDS for PostgreSQL:** Managed PostGIS database.
    *   **Amazon DocumentDB or MongoDB Atlas:** Managed MongoDB service.
    *   **S3 (Simple Storage Service):** Store raw uploaded data, satellite imagery, and user-submitted photos.
    *   **CloudFront:** CDN to serve the frontend application quickly.
    *   **Route 53:** For DNS management.
3.  **CI/CD:** A pipeline (e.g., GitHub Actions) will be set up to automatically build, test, and deploy services when code is pushed to the main branch.

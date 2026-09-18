# Stock Trend Predictor

SIMPLE PROJECT PROMPT

Project Title

Intelligent Stock Trend Prediction System Using Machine Learning

Project Objective

Develop a simple web application that uses historical stock market data to predict whether a stock price is likely to go UP, DOWN, or remain NEUTRAL.

The system should also provide a simple investment insight based on the prediction.

The project is mainly for educational and academic purposes. It should not claim to provide guaranteed financial advice.

TECHNOLOGIES

Use simple technologies:

Frontend

HTML

CSS

JavaScript

Chart.js

Backend

Python

Flask

Machine Learning

Python

Pandas

NumPy

Scikit-learn

Random Forest Classifier

Database

MySQL

MODULE 1 — STOCK DATA COLLECTION

Purpose

Collect and display historical stock information.

Features

The user can:

Enter a stock name/ticker.

Select a date range.

Get historical stock data.

View the data in a table.

View a simple stock price chart.

Display:

Date

Open

High

Low

Close

Volume

Simple workflow

Enter Stock → Get Historical Data → Display Data → Show Chart

MODULE 2 — STOCK TREND PREDICTION

Purpose

Use machine learning to predict the stock trend.

Use Random Forest Classifier.

The model should use simple features such as:

Previous closing price

Current closing price

Open price

High price

Low price

Trading volume

Simple Moving Average

The system should predict only:

UP 📈

Stock is likely to move upward.

DOWN 📉

Stock is likely to move downward.

NEUTRAL ➡️

No strong upward or downward movement is detected.

Workflow

Historical Data → Data Cleaning → Feature Creation → ML Model → Trend Prediction

Display:

Predicted Trend

Prediction Confidence

Example:

Stock: ABC

Predicted Trend: UP 📈
Confidence: 78%


MODULE 3 — INVESTMENT INSIGHT

Purpose

Convert the prediction into a simple understandable insight.

Based on the predicted trend, generate:

If UP

Market Trend: Positive

The model identifies an upward trend based
on historical stock patterns.

Insight: Positive outlook.


If DOWN

Market Trend: Negative

The model identifies a downward trend based
on historical stock patterns.

Insight: Cautious outlook.


If NEUTRAL

Market Trend: Neutral

The model does not identify a strong upward
or downward trend.

Insight: Wait and observe.


Also display:

Predicted Trend

Confidence

Simple Risk Level

Risk levels:

Low

Medium

High

Do not provide guaranteed buy/sell recommendations.

MODULE 4 — DASHBOARD

Purpose

Display all the results in one simple dashboard.

Create a clean dashboard containing:

Stock Search

Enter Stock Symbol: [________]

[ Analyze Stock ]


Stock Information

Display cards for:

Latest Price
Daily Change
Volume
Predicted Trend
Confidence
Risk Level


Historical Chart

Show a simple line chart of the stock's historical closing price.

Prediction

Example:

AI STOCK TREND PREDICTION

Trend: UP 📈
Confidence: 78%

Risk Level: Medium


Investment Insight

Example:

AI Insight

The historical data indicates a positive
short-term trend. The model has moderate
confidence in this prediction.


Disclaimer

This system provides educational insights
based on historical market data. Predictions
are not guaranteed and should not be treated
as financial advice.


SIMPLE SYSTEM WORKFLOW

        USER
          ↓
   Enter Stock Symbol
          ↓
   Historical Stock Data
          ↓
     Data Cleaning
          ↓
    Feature Creation
          ↓
   Random Forest Model
          ↓
   Trend Prediction
          ↓
    UP / DOWN / NEUTRAL
          ↓
   Confidence Calculation
          ↓
   Investment Insight
          ↓
      Dashboard


SIMPLE DATABASE

Use only 3 main tables.

users

id
name
email
password
role


stocks

id
ticker
company_name


predictions

id
ticker
prediction
confidence
risk_level
prediction_date


Don't create unnecessary database tables.

USER ROLES

Use only two roles.

ADMIN

Admin can:

Login

View users

Add/remove stock information

View prediction history

View system statistics

ANALYST

Analyst can:

Login

Search stocks

View historical data

Run prediction

View UP/DOWN/NEUTRAL result

View confidence

View investment insight

View charts

Do not create a Student role.

SIMPLE WEBSITE PAGES

Create only these pages:

1. Login

Username/email and password.

2. Dashboard

Main page containing stock search, charts, prediction and insight.

3. Stock Analysis

Historical stock data and price chart.

4. Prediction

Trend prediction and confidence.

5. Insights

Simple investment insight and risk level.

6. Admin

Basic user and stock management.

SIMPLE MACHINE LEARNING PROCESS

Use Random Forest.

The process should be:

Historical Stock Data
        ↓
Remove Missing Values
        ↓
Create Features
        ↓
Create Target
        ↓
Train Random Forest
        ↓
Test Model
        ↓
Predict Trend
        ↓
Show Confidence


Use historical data to create the target:

Price increases → UP

Price decreases → DOWN

Small/no change → NEUTRAL


Use a chronological train/test split.

Display the actual calculated model accuracy on the dashboard or prediction page.

Do not use fake accuracy values.

SIMPLE PROJECT FOLDER

Use a beginner-friendly structure:

stock_prediction/
│
├── app.py
├── train_model.py
├── requirements.txt
│
├── model/
│   └── stock_model.pkl
│
├── templates/
│   ├── login.html
│   ├── dashboard.html
│   ├── analysis.html
│   ├── prediction.html
│   ├── insights.html
│   └── admin.html
│
├── static/
│   ├── style.css
│   └── script.js
│
└── database/
    └── database.sql


IMPORTANT REQUIREMENTS

Make the project:

Simple

Easy to understand

Easy to demonstrate

Easy to explain in viva

Responsive

Professional looking

Fully functional

Do not add unnecessary advanced features.

Do not use:

LSTM

GRU

Deep learning

Complex optimization algorithms

Multiple complicated ML models

Complicated authentication

Excessive technical indicators

Complex financial calculations

Use Random Forest + historical data + simple features.

FINAL PROJECT FLOW

The complete project should work as:

Login → Dashboard → Enter Stock → Get Historical Data → Analyze Data → Predict UP/DOWN/NEUTRAL → Show Confidence → Generate Simple Investment Insight → Display Result

The final system should clearly demonstrate these four modules:

Module 1: Stock Data Collection
Module 2: Stock Trend Prediction
Module 3: Investment Insight Generation
Module 4: Dashboard & Visualization

Build the complete working application rather than only creating a UI prototype. All buttons, prediction functions, charts, database operations, and backend APIs should work properly.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b0ad05db-79ae-45ac-b188-11fecb2db75e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

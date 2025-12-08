#!/bin/bash

echo "🚀 Starting local Supabase..."
docker compose -f ~/supabase-project/docker-compose.yml up -d

echo "🛠 Starting API server..."
cd api

env/bin/python app.py

# Multi-stage build - reduces final image size

# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
# Why copy .csproj first? Docker caches layers - if dependencies don't change,
# this layer is reused, making builds faster
COPY ["FlightPredictor.API.csproj", "./"]
RUN dotnet restore "FlightPredictor.API.csproj"

# Copy the rest of the code
COPY . .

# Build the application
# -c Release = optimized build for production
# -o /app/build = output directory
RUN dotnet build "FlightPredictor.API.csproj" -c Release -o /app/build

# Stage 2: Publish the application
FROM build AS publish
RUN dotnet publish "FlightPredictor.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Create the final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the published application from the publish stage
COPY --from=publish /app/publish .

# Expose port 80 for HTTP traffic
EXPOSE 80

# Set environment variable to listen on port 80
ENV ASPNETCORE_URLS=http://+:80

# Run the application
ENTRYPOINT ["dotnet", "FlightPredictor.API.dll"]
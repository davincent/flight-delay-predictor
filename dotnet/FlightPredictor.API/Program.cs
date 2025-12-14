using FlightPredictor.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the dependency injection container
builder.Services.AddControllers();

// Register ML services
builder.Services.AddSingleton<AirportService>();
builder.Services.AddSingleton<HistoricalStatsService>();
builder.Services.AddSingleton<FeatureEngineeringService>();
builder.Services.AddSingleton<WeatherService>();
builder.Services.AddSingleton<ModelService>();

// Add Swagger for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Flight Delay Predictor API",
        Version = "v1",
        Description = "API for predicting flight delays using ML"
    });
});

// Add CORS - MOVED BEFORE builder.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")  // Vite's default port
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();  // ← Build happens AFTER all services are registered

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");  // Use the policy we defined
app.UseAuthorization();
app.MapControllers();

app.Run();
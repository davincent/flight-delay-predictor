using FlightPredictor.Web.Components;
using FlightPredictor.Web.Services;

var builder = WebApplication.CreateBuilder(args);

// Register HTTP client for API calls
builder.Services.AddHttpClient<FlightApiClient>(client =>
{
    // This URL will work in Docker Compose using service names
    var apiUrl = builder.Configuration.GetValue<string>("ApiUrl") ?? "http://api:80";
    client.BaseAddress = new Uri(apiUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();


app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();

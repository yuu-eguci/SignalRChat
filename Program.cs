using SignalRChat.Hubs;
using SignalRChat.Models;

var builder = WebApplication.CreateBuilder(args);

// NOTE: 今回欲しい Console log provider は既定のセットに含まれています。
//       ClearProviders() は行いません。
builder.Services.AddRazorPages();
// SignalR を ASP.NET Core 依存関係に追加。
builder.Services.AddSignalR();
// CORS を使う準備です。
builder.Services.AddCors();
// appsettings.json を AppSettings にロードします。
// services に足すことで Dependency Injection してくれて、コントローラで取得できるようになります。
builder.Services.Configure<AppSettings>(builder.Configuration);

var app = builder.Build();

var settings = app.Configuration.Get<AppSettings>() ?? new AppSettings();
app.Logger.LogInformation("Configuration[WebBaseUrl]: {WebBaseUrl}", settings.WebBaseUrl);
app.Logger.LogInformation("Configuration[EnvName]: {EnvName}", settings.EnvName);

if (app.Environment.IsDevelopment())
{
    app.Logger.LogInformation("env.IsDevelopment でした!!!!");
}
else
{
    app.Logger.LogInformation("Not env.IsDevelopment でした!!!!");
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// Make sure the CORS middleware is ahead of SignalR.
app.UseCors(policy =>
{
    policy.WithOrigins(settings.WebBaseUrl)
        .AllowAnyHeader()
        .WithMethods("GET", "POST")
        .AllowCredentials();
});

app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(120),
});

// WebSocket は CORS の対象外なので、同一オリジンと WebBaseUrl 以外からの接続を拒否します。
app.Use(async (context, next) =>
{
    var origin = context.Request.Headers.Origin.ToString();
    var sameOrigin = $"{context.Request.Scheme}://{context.Request.Host}";
    if (context.WebSockets.IsWebSocketRequest
        && origin.Length > 0
        && !string.Equals(origin, sameOrigin, StringComparison.OrdinalIgnoreCase)
        && !string.Equals(origin, settings.WebBaseUrl, StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return;
    }
    await next(context);
});

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();
// SignalR を ルーティングシステムに追加。
app.MapHub<ChatHub>("/chatHub");

app.Logger.LogInformation("WebApplication が出来たぞ!!!!");

app.Run();

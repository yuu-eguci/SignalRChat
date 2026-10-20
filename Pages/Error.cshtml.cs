using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace SignalRChat.Pages;

[ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
[IgnoreAntiforgeryToken]
public class ErrorModel(ILogger<ErrorModel> logger) : PageModel
{
    public string? RequestId { get; set; }

    public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);

    public void OnGet()
    {
        RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier;

        Console.WriteLine("Console.WriteLine からのログ!!!!");
        logger.Log(LogLevel.Information, "_logger.Log LogLevel.Information からのログ!!!!");
        logger.LogInformation("_logger.LogInformation からのログ!!!!");
        logger.LogError("_logger.LogError からのログ!!!!");
    }
}

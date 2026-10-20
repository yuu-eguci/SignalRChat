using Microsoft.AspNetCore.Mvc.RazorPages;

namespace SignalRChat.Pages;

public class IndexModel(ILogger<IndexModel> logger, IConfiguration configuration) : PageModel
{
    public void OnGet()
    {
        Console.WriteLine("Console.WriteLine からのログ!!!!");
        logger.Log(LogLevel.Information, "_logger.Log LogLevel.Information からのログ!!!!");
        logger.LogInformation("_logger.LogInformation からのログ!!!!");
        logger.LogError("_logger.LogError からのログ!!!!");
        logger.LogInformation("Configuration[WebBaseUrl]: {WebBaseUrl}", configuration["WebBaseUrl"]);
    }
}

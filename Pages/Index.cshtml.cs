using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using SignalRChat.Models;
using Microsoft.Extensions.Configuration;

namespace SignalRChat.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;
        private readonly IConfiguration _configuration;

        public IndexModel(ILogger<IndexModel> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public void OnGet()
        {
            Console.WriteLine("Console.WriteLine からのログ!!!!");
            _logger.Log(LogLevel.Information, "_logger.Log LogLevel.Information からのログ!!!!");
            _logger.LogInformation("_logger.LogInformation からのログ!!!!");
            _logger.LogError("_logger.LogError からのログ!!!!");
            string webBaseUrl = _configuration["WebBaseUrl"];
            _logger.LogInformation($"Configuration[WebBaseUrl]: {webBaseUrl}");
        }
    }
}
